#!/usr/bin/env python3
"""Independent integer-only reproduction; no RPC, no wallets, no floating point."""
import json
from pathlib import Path
P=Path(__file__).parent
load=lambda name:json.loads((P/'evidence'/f'{name}.json').read_text())
U=10**18
v=load('vulnerable'); c=load('control'); o=load('opening-state')
q=lambda a,ri,ro,fee=3:a*(1000-fee)*ro//(ri*1000+a*(1000-fee))
loan=10000*U; buy=9000*U; locked=3000*U; debt=8000*U; flashfee=loan*5//10000
s=10000*U; col=10000*U
bought=q(buy,s,col);peak_s=s+buy;peak_c=col-bought
peak=peak_s*U//peak_c
limit=locked*peak//U*7500//10000
sold=bought-locked;out=q(sold,peak_c,peak_s)
end_s=peak_s-out;end_c=peak_c+sold;end=end_s*U//end_c
profit=loan-buy+debt+out-loan-flashfee
recover=q(locked,end_c,end_s)
anchor_value=locked
anchor_shortfall=debt-anchor_value
exit_shortfall=debt-recover
# Counterfactual run with SAME transaction amounts but AMM fee=0; price path changes too.
b0=q(buy,s,col,0);r0=q(b0-locked,col-b0,s+buy,0)
p0=loan-buy+debt+r0-loan
assert int(v['after']['stable']['receiver'])==profit
assert int(v['after']['stable']['amm'])==end_s
assert int(v['after']['collateral']['amm'])==end_c==7000*U
assert int(v['after']['debt'])==debt
assert int(v['after']['deposited'])==locked
assert int(v['after']['price'])==end
assert int(v['after']['stable']['lender'])==100000*U+flashfee
assert int(v['after']['stable']['borrowing'])==50000*U-debt
assert profit+flashfee+(end_s-s)==debt # Exact tUSD source/use reconciliation.
assert anchor_shortfall==profit+flashfee+(end_s-s)-anchor_value
assert end_s*end_c>=s*col
assert profit>0 # No float-valued derived economic fields.
assert limit>=debt and locked*7500//10000<debt
for branch in [v,c]:
 for side in ['before','after']:
  z=branch[side]
  assert sum(map(int,z['stable'].values()))==int(z['stableSupply'])
  assert sum(map(int,z['collateral'].values()))==int(z['collateralSupply'])
a={k:v for k,v in c['before'].items() if k not in ['operatorNative','operatorNonce']}
b={k:v for k,v in c['after'].items() if k not in ['operatorNative','operatorNonce']}
assert a==b
for k in o:
 if k not in ['source','operatorNative','operatorNonce']:assert o[k]==c['before'][k]
assert c['ethCall']['decodedError']['args']==[str(debt),str(2250*U),str(U)]
assert c['receipt']['status']=='reverted' and not c['receipt']['logs']
def walk(node):
 yield node
 for child in node.get('calls',[]):yield from walk(child)
vt=list(walk(load('vulnerable-transaction-trace-decoded')))
ct=list(walk(load('control-transaction-trace-decoded')))
assert int(next(x['result'] for x in vt if x.get('function')=='spotPrice'))==peak
assert int(next(x['result'] for x in ct if x.get('function')=='spotPrice'))==peak
assert int(next(x['result'] for x in ct if x.get('contract')=='ToyFixedSource' and x.get('function')=='price'))==U
assert next(x['args'] for x in vt if x.get('function')=='borrow')==next(x['args'] for x in ct if x.get('function')=='borrow')==[str(debt)]

swaps=[e for e in v['decodedEvents'] if e.get('eventName')=='Swap']
assert len(swaps)==2
assert int(swaps[0]['args']['output'])==bought
assert int(swaps[1]['args']['output'])==out
stages=[e for e in v['decodedEvents'] if e.get('eventName')=='Stage']
assert int(stages[0]['args']['spot'])==peak
assert int(stages[-1]['args']['spot'])==end
for branch in [v,c]:
 cost=int(branch['receipt']['gasUsed'])*int(branch['receipt']['effectiveGasPrice'])
 assert int(branch['before']['operatorNative'])-int(branch['after']['operatorNative'])==cost
 assert branch['after']['operatorNonce']==branch['before']['operatorNonce']+1
result=dict(unit='All monetary fields raw 18-decimal integers, NOT real USD',loan=loan,buy=buy,bought=bought,locked=locked,sold=sold,saleOutput=out,peakPrice=peak,initialPrice=U,endPrice=end,peakBorrowLimit=limit,safeBorrowLimit=2250*U,debt=debt,flashFee=flashfee,ammBuyFeeStable=buy*3//1000,ammSellFeeCollateral=sold*3//1000,profitAfterFeesBeforeGas=profit,profitBeforeFlashFee=profit+flashfee,noAMMNoFlashCounterfactualProfit=p0,combinedAMMFeePathEffect=p0-(profit+flashfee),anchorCollateralValue=anchor_value,anchorShortfall=anchor_shortfall,executableAMMQuoteRecovery=recover,exitQuoteShortfall=exit_shortfall,ammStableGain=end_s-s,stableSupply=200000*U,collateralSupply=20000*U,vulnerableGas=int(v['receipt']['gasUsed']),controlGas=int(c['receipt']['gasUsed']),gasPriceWei=int(v['receipt']['effectiveGasPrice']),checks='All integer, events, reserves, two token conservation, snapshot/source-only control, fee repayment, financial rollback and gas/nonce assertions PASSED')
(P/'evidence'/'reconciliation.json').write_text(json.dumps(result,indent=2)+'\n')
print('INTEGER RECONCILIATION PASSED; profit raw =',profit)
