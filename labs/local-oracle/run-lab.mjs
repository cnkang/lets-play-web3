import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createPublicClient,createWalletClient,http,encodeDeployData,encodeFunctionData,decodeEventLog,decodeErrorResult,decodeFunctionData,decodeFunctionResult,toHex,formatUnits} from 'viem';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {foundry} from 'viem/chains';
import {WRITE_URL,assertChainId,preflight} from './guard.mjs';
// No URL argument or external chain configuration is accepted.
if(process.argv.length!==2)throw Error('No RPC/chain overrides allowed');
const URL=WRITE_URL;
await preflight(URL);
const client=createPublicClient({chain:foundry,transport:http(URL,{retryCount:0})});
const account=privateKeyToAccount(generatePrivateKey()); // Memory only, never printed or saved.
const wallet=createWalletClient({account,chain:foundry,transport:http(URL,{retryCount:0})});
const U=10n**18n;
const save=(name,obj)=>fs.writeFileSync(`evidence/${name}.json`,JSON.stringify(obj,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
const records=[];const contracts={};
async function guard(){assertChainId(await client.getChainId());}
await guard();
const nodeInfo=await client.request({method:'anvil_nodeInfo'});
await client.request({method:'anvil_setBalance',params:[account.address,toHex(100n*U)]});
save('environment',{label:'FICTIONAL LOCAL ANVIL ONLY; NOT SEPOLIA',url:URL,chainId:31337,nodeInfo,operator:account.address,clientVersion:await client.request({method:'web3_clientVersion'}),genesis:await client.getBlock({blockNumber:0n}),nativeBootstrap:'100 mock ETH via anvil_setBalance for ephemeral local gas only'});
const artifact=n=>JSON.parse(fs.readFileSync(`artifacts/LocalOracleLab.sol/${n}.json`));
function events(receipt){return receipt.logs.map(log=>{for(const [name,c]of Object.entries(contracts))if(c.address.toLowerCase()===log.address.toLowerCase()){
  try{return {name,address:log.address,logIndex:log.logIndex,...decodeEventLog({abi:c.abi,data:log.data,topics:log.topics})};}catch{}}
  return {raw:log};});}
async function send(label,data,to){
 await guard();const tx={account,data,...(to?{to}:{}),gasPrice:1000000000n};
 await client.call(tx);const estimate=await client.estimateGas(tx);
 const hash=await wallet.sendTransaction({...tx,gas:estimate*12n/10n+10000n});
 const receipt=await client.waitForTransactionReceipt({hash});assert.equal(receipt.status,'success');
 const transaction=await client.getTransaction({hash});assert.equal(transaction.chainId,31337);
 const item={label,simulation:'eth_call success before send',estimatedGas:estimate,transaction,receipt,decodedEvents:events(receipt)};
 records.push(item);save('transactions',records);console.log(label,hash,'gas',receipt.gasUsed.toString());return receipt;
}
async function deploy(name,args=[]){const a=artifact(name);const r=await send(`deploy ${name}`,encodeDeployData({abi:a.abi,bytecode:a.bytecode.object,args}));
 contracts[name]={address:r.contractAddress,abi:a.abi};assert.notEqual(await client.getCode({address:r.contractAddress}),'0x');return r.contractAddress;}
const s=await deploy('ToyToken',['Toy Stable (NOT USD)','tUSD',200000n*U]);
// Two instances of same artifact, explicit names for accurate event decoding.
contracts.Stable=contracts.ToyToken;delete contracts.ToyToken;
const c=await deploy('ToyToken',['Toy Collateral (NOT WETH)','tCOL',20000n*U]);contracts.Collateral=contracts.ToyToken;delete contracts.ToyToken;
const amm=await deploy('ToyAMM',[s,c]);const spot=await deploy('ToySpotSource',[amm]);const fixed=await deploy('ToyFixedSource');
const borrowing=await deploy('ToyBorrowing',[s,c,spot]);const lender=await deploy('ToyFlashLender',[s]);
const receiver=await deploy('ToyScenario',[s,c,amm,borrowing,lender]);
const read=(name,fn,args=[])=>client.readContract({...contracts[name],functionName:fn,args});
const write=(name,fn,args=[],label=`${name}.${fn}`)=>send(label,encodeFunctionData({abi:contracts[name].abi,functionName:fn,args}),contracts[name].address);
await write('Stable','transfer',[amm,10000n*U],'seed AMM stable');await write('Collateral','transfer',[amm,10000n*U],'seed AMM collateral');
await write('Stable','transfer',[lender,100000n*U],'seed flash lender');await write('Stable','transfer',[borrowing,50000n*U],'seed borrowing pool');
for(const [name,checks] of Object.entries({ToyAMM:{stable:s,collateral:c},ToyBorrowing:{stable:s,collateral:c,source:spot},ToyFlashLender:{stable:s},ToyScenario:{stable:s,collateral:c,amm,borrowing,lender,operator:account.address}})){
 for(const [fn,expected] of Object.entries(checks))assert.equal((await read(name,fn)).toLowerCase(),expected.toLowerCase());
}
save('verified-configuration',{chainId:31337,loan:'10000 tUSD',buy:'9000 tUSD',collateral:'3000 tCOL',borrow:'8000 tUSD',ltvBps:7500,flashFeeBps:5,ammFeeBps:30,allImmutableCounterpartiesVerified:true,initialSource:spot,controlSource:fixed});
save('addresses',Object.fromEntries(Object.entries(contracts).map(([k,v])=>[k,v.address])));
const holders={operator:account.address,amm,borrowing,lender,receiver};
async function state(){const st={stable:{},collateral:{},allowances:{}};
 for(const [name,addr]of Object.entries(holders)){st.stable[name]=await read('Stable','balanceOf',[addr]);st.collateral[name]=await read('Collateral','balanceOf',[addr]);}
 for(const [token,other]of [['Stable',amm],['Stable',lender],['Collateral',amm],['Collateral',borrowing]])st.allowances[`${token}:${other}`]=await read(token,'allowance',[receiver,other]);
 st.stableSupply=await read('Stable','totalSupply');st.collateralSupply=await read('Collateral','totalSupply');
 assert.equal(Object.values(st.stable).reduce((a,b)=>a+b,0n),st.stableSupply);
 assert.equal(Object.values(st.collateral).reduce((a,b)=>a+b,0n),st.collateralSupply);
 st.debt=await read('ToyBorrowing','debt',[receiver]);st.deposited=await read('ToyBorrowing','deposited',[receiver]);
 st.price=await read('ToyAMM','spotPrice');st.source=await read('ToyBorrowing','source');
 st.operatorNative=await client.getBalance({address:account.address});st.operatorNonce=await client.getTransactionCount({address:account.address});return st;}
const opening=await state();save('opening-state',opening);
const snapshot=await client.request({method:'evm_snapshot'});save('snapshot',{id:snapshot,block:await client.getBlockNumber()});
const runData=encodeFunctionData({abi:contracts.ToyScenario.abi,functionName:'run'});
const trace=await client.request({method:'debug_traceCall',params:[{from:account.address,to:receiver,data:runData},'latest',{tracer:'callTracer'}]});save('vulnerable-simulation-trace',trace);
const vulnerableBefore=await state();const vulnerableReceipt=await write('ToyScenario','run',[],'vulnerable atomic scenario');
const vulnerableAfter=await state();save('vulnerable',{before:vulnerableBefore,after:vulnerableAfter,receipt:vulnerableReceipt,decodedEvents:events(vulnerableReceipt)});
save('vulnerable-transaction-trace',await client.request({method:'debug_traceTransaction',params:[vulnerableReceipt.transactionHash,{tracer:'callTracer'}]}));
assert.equal(vulnerableAfter.debt,8000n*U);assert.equal(vulnerableAfter.deposited,3000n*U);
assert.equal(vulnerableAfter.stable.lender-opening.stable.lender,5n*U);
assert.equal(opening.stable.borrowing-vulnerableAfter.stable.borrowing,8000n*U);
assert.ok(vulnerableAfter.stable.receiver>0n);assert.equal(vulnerableAfter.collateral.receiver,0n);
for(const a of Object.values(vulnerableAfter.allowances))assert.equal(a,0n);
assert.equal(vulnerableBefore.operatorNative-vulnerableAfter.operatorNative,vulnerableReceipt.gasUsed*vulnerableReceipt.effectiveGasPrice);
// Restore identical contracts, token reserves, balances, approvals and transaction parameters.
assert.equal(await client.request({method:'evm_revert',params:[snapshot]}),true);
assert.deepEqual(await state(),opening);
await write('ToyBorrowing','setSource',[fixed],'control: change ONLY valuation source');
const controlBefore=await state();
let revertData;try{await client.call({account,to:receiver,data:runData});throw Error('Expected rejection');}catch(e){
 let z=e;while(z){if(typeof z.data==='string' && z.data.startsWith('0x')){revertData=z.data;break;}z=z.cause;}
 if(!revertData)throw e;
}
const decodedError=decodeErrorResult({abi:contracts.ToyBorrowing.abi,data:revertData});assert.equal(decodedError.errorName,'BorrowLimit');
assert.deepEqual(decodedError.args,[8000n*U,2250n*U,U]);
let estimateRejected=false;try{await client.estimateGas({account,to:receiver,data:runData});}catch{estimateRejected=true;}assert.ok(estimateRejected);
const controlTrace=await client.request({method:'debug_traceCall',params:[{from:account.address,to:receiver,data:runData},'latest',{tracer:'callTracer'}]});save('control-simulation-trace',controlTrace);
// Reverting transactions have no successful gas estimate. Record trace gas and a bounded local gas cap.
await guard();const failedHash=await wallet.sendTransaction({to:receiver,data:runData,gas:1000000n,gasPrice:1000000000n});
const failedReceipt=await client.waitForTransactionReceipt({hash:failedHash});assert.equal(failedReceipt.status,'reverted');assert.equal(failedReceipt.logs.length,0);
const failedTransaction=await client.getTransaction({hash:failedHash});assert.equal(failedTransaction.chainId,31337);
const controlAfter=await state();
const financial=x=>{const {operatorNative,operatorNonce,...rest}=x;return rest;};
assert.deepEqual(financial(controlBefore),financial(controlAfter));
assert.equal(controlAfter.operatorNonce,controlBefore.operatorNonce+1);
assert.equal(controlBefore.operatorNative-controlAfter.operatorNative,failedReceipt.gasUsed*failedReceipt.effectiveGasPrice);
save('control',{before:controlBefore,after:controlAfter,ethCall:{revertData,decodedError},estimateRejected,traceGasUsed:controlTrace.gasUsed,gasLimit:1000000n,receipt:failedReceipt,decodedEvents:events(failedReceipt),assertions:{tokenDebtCollateralAllowanceRollback:true,gasAndNonceNotRolledBack:true}});
records.push({label:'fixed-source rejected scenario',simulation:'eth_call and estimateGas REJECTED as expected',revertData,decodedError,traceGasUsed:controlTrace.gasUsed,gasLimit:1000000n,transaction:failedTransaction,receipt:failedReceipt,decodedEvents:[]});
for(const record of records)record.decodedEvents=events(record.receipt);
save('transactions',records);
save('control-transaction-trace',await client.request({method:'debug_traceTransaction',params:[failedHash,{tracer:'callTracer'}]}));
save('assertions',{chain31337:true,noFork:true,freshGenesis:true,sourceOnlyDifference:true,sameScenarioCalldata:runData,conservationBothTokensAllHolders:true,flashPrincipalAndFeeRepaid:true,remainingDebt8000:true,lockedCollateral3000:true,receiverZeroInitialFunds:true,allApprovalsConsumedInSuccess:true,controlFailureExact:'BorrowLimit(8000e18,2250e18,1e18)',controlZeroReceiptLogs:true,controlFinancialStateUnchanged:true,gasAndNonceChargedOnFailure:true});
console.log('VULNERABLE PROFIT',formatUnits(vulnerableAfter.stable.receiver,18));console.log('CONTROL REVERT',failedHash,decodedError.errorName,'gas',failedReceipt.gasUsed.toString());

function decodeTrace(node){
 const known=Object.entries(contracts).find(([_,c])=>c.address.toLowerCase()===node.to?.toLowerCase());
 const result={type:node.type,contract:known?.[0]??node.to,gasUsed:node.gasUsed,error:node.error};
 if(known){try{const decoded=decodeFunctionData({abi:known[1].abi,data:node.input});result.function=decoded.functionName;result.args=decoded.args;
  if(!node.error&&node.output&&node.output!=='0x')result.result=decodeFunctionResult({abi:known[1].abi,functionName:decoded.functionName,data:node.output});
 }catch{}}
 if(node.error&&node.output)try{result.revert=decodeErrorResult({abi:contracts.ToyBorrowing.abi,data:node.output});}catch{}
 if(node.calls)result.calls=node.calls.map(decodeTrace);return result;
}
for(const name of ['vulnerable-simulation-trace','vulnerable-transaction-trace','control-simulation-trace','control-transaction-trace']){
 save(name+'-decoded',decodeTrace(JSON.parse(fs.readFileSync('evidence/'+name+'.json'))));
}
