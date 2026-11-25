// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// CLOSED TOY LESSON ONLY. No external deployments, forks or production assets.
abstract contract LocalOnly {
    constructor() { require(block.chainid == 31337, "LOCAL_CHAIN_ONLY"); }
    modifier localOnly() { require(block.chainid == 31337, "LOCAL_CHAIN_ONLY"); _; }
}
contract ToyToken is LocalOnly {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    // Only constructor issuance: no mint entry point, especially none in callbacks.
    constructor(string memory n, string memory s, uint256 supply) {
        name=n; symbol=s; totalSupply=supply; balanceOf[msg.sender]=supply;
        emit Transfer(address(0), msg.sender, supply);
    }
    function approve(address to, uint256 amount) external localOnly returns(bool) {
        allowance[msg.sender][to]=amount; emit Approval(msg.sender,to,amount); return true;
    }
    function transfer(address to,uint256 amount) external localOnly returns(bool) {
        _move(msg.sender,to,amount);return true;
    }
    function transferFrom(address from,address to,uint256 amount) external localOnly returns(bool) {
        require(allowance[from][msg.sender]>=amount,"ALLOWANCE");
        allowance[from][msg.sender]-=amount; emit Approval(from,msg.sender,allowance[from][msg.sender]);
        _move(from,to,amount);return true;
    }
    function _move(address from,address to,uint256 amount) private {
        require(balanceOf[from]>=amount,"BALANCE"); require(to!=address(0),"ZERO");
        balanceOf[from]-=amount; balanceOf[to]+=amount;emit Transfer(from,to,amount);
    }
}
contract ToyAMM is LocalOnly {
    ToyToken public immutable stable;
    ToyToken public immutable collateral;
    event Swap(address indexed trader,bool stableIn,uint256 input,uint256 output,uint256 feeInput,uint256 stableReserve,uint256 collateralReserve);
    constructor(ToyToken s,ToyToken c){stable=s;collateral=c;}
    function spotPrice() external view returns(uint256) {
        return stable.balanceOf(address(this))*1e18/collateral.balanceOf(address(this));
    }
    function quote(uint256 amount,uint256 reserveIn,uint256 reserveOut) public pure returns(uint256){
        return amount*997*reserveOut/(reserveIn*1000+amount*997);
    }
    function swap(bool stableIn,uint256 amount,uint256 minOut) external localOnly returns(uint256 output) {
        ToyToken input=stableIn?stable:collateral; ToyToken out=stableIn?collateral:stable;
        uint256 ri=input.balanceOf(address(this)); uint256 ro=out.balanceOf(address(this));
        output=quote(amount,ri,ro);require(output>=minOut && output>0,"MIN_OUT");
        input.transferFrom(msg.sender,address(this),amount);out.transfer(msg.sender,output);
        require(input.balanceOf(address(this))*out.balanceOf(address(this))>=ri*ro,"K");
        emit Swap(msg.sender,stableIn,amount,output,amount*3/1000,stable.balanceOf(address(this)),collateral.balanceOf(address(this)));
    }
}
interface PriceSource {function price() external view returns(uint256);}
contract ToySpotSource is LocalOnly, PriceSource {
    ToyAMM public immutable amm;
    constructor(ToyAMM a){amm=a;}
    function price() external view returns(uint256){return amm.spotPrice();}
}
contract ToyFixedSource is LocalOnly, PriceSource {
    function price() external pure returns(uint256){return 1e18;}
}
contract ToyBorrowing is LocalOnly {
    ToyToken public immutable stable;
    ToyToken public immutable collateral;
    address public immutable controller;
    PriceSource public source;
    uint256 public constant LTV_BPS=7500;
    mapping(address=>uint256) public deposited;
    mapping(address=>uint256) public debt;
    error BorrowLimit(uint256 requestedDebt,uint256 maximumDebt,uint256 oraclePrice);
    event SourceChanged(address indexed source);
    event Deposit(address indexed user,uint256 amount);
    event Borrow(address indexed user,uint256 amount,uint256 debtAfter,uint256 price,uint256 maximumDebt);
    event Repay(address indexed user,uint256 amount);
    constructor(ToyToken s,ToyToken c,PriceSource p){stable=s;collateral=c;source=p;controller=msg.sender;}
    function setSource(PriceSource p) external localOnly {
        require(msg.sender==controller,"CONTROLLER");source=p;emit SourceChanged(address(p));
    }
    function deposit(uint256 amount) external localOnly {
        collateral.transferFrom(msg.sender,address(this),amount);deposited[msg.sender]+=amount;emit Deposit(msg.sender,amount);
    }
    function borrow(uint256 amount) external localOnly {
        uint256 p=source.price();uint256 maximum=deposited[msg.sender]*p/1e18*LTV_BPS/10000;
        uint256 next=debt[msg.sender]+amount;if(next>maximum)revert BorrowLimit(next,maximum,p);
        debt[msg.sender]=next;stable.transfer(msg.sender,amount);emit Borrow(msg.sender,amount,next,p,maximum);
    }
    function repay(uint256 amount) external localOnly {
        require(amount<=debt[msg.sender],"OVERPAY");stable.transferFrom(msg.sender,address(this),amount);
        debt[msg.sender]-=amount;emit Repay(msg.sender,amount);
    }
    function withdraw(uint256 amount) external localOnly {
        require(amount<=deposited[msg.sender],"DEPOSIT");
        uint256 remaining=deposited[msg.sender]-amount;
        require(debt[msg.sender]<=remaining*source.price()/1e18*LTV_BPS/10000,"DEBT");
        deposited[msg.sender]=remaining;collateral.transfer(msg.sender,amount);
    }
}
interface ToyCallback {function onToyFlash(uint256 amount,uint256 fee) external;}
contract ToyFlashLender is LocalOnly {
    ToyToken public immutable stable;
    uint256 public constant FEE_BPS=5;
    bool private locked;
    event Flash(address indexed receiver,uint256 principal,uint256 fee,uint256 balanceBefore,uint256 balanceAfter);
    constructor(ToyToken s){stable=s;}
    function flash(uint256 amount) external localOnly {
        require(!locked,"LOCK");locked=true;
        uint256 beforeBalance=stable.balanceOf(address(this));uint256 fee=amount*FEE_BPS/10000;
        stable.transfer(msg.sender,amount);ToyCallback(msg.sender).onToyFlash(amount,fee);
        stable.transferFrom(msg.sender,address(this),amount+fee);
        require(stable.balanceOf(address(this))==beforeBalance+fee,"NOT_REPAID");
        locked=false;emit Flash(msg.sender,amount,fee,beforeBalance,stable.balanceOf(address(this)));
    }
}
// Hardcoded pedagogical amounts and local immutable counterparties, not a generic target runner.
contract ToyScenario is LocalOnly, ToyCallback {
    ToyToken public immutable stable;ToyToken public immutable collateral;
    ToyAMM public immutable amm;ToyBorrowing public immutable borrowing;ToyFlashLender public immutable lender;
    address public immutable operator;
    event Stage(uint8 indexed step,uint256 spot,uint256 stableHeld,uint256 collateralHeld);
    event Completed(uint256 principal,uint256 fee,uint256 profit);
    constructor(ToyToken s,ToyToken c,ToyAMM a,ToyBorrowing b,ToyFlashLender l){
        stable=s;collateral=c;amm=a;borrowing=b;lender=l;operator=msg.sender;
    }
    function run() external localOnly {
        require(msg.sender==operator,"OPERATOR");
        require(stable.balanceOf(address(this))==0 && collateral.balanceOf(address(this))==0,"FRESH_ONLY");
        lender.flash(10000e18);
        require(stable.balanceOf(address(this))>=1e18,"MIN_PROFIT");
        emit Completed(10000e18,5e18,stable.balanceOf(address(this)));
    }
    function onToyFlash(uint256 amount,uint256 fee) external localOnly {
        require(msg.sender==address(lender) && amount==10000e18 && fee==5e18,"CALLBACK");
        stable.approve(address(amm),9000e18);amm.swap(true,9000e18,1);
        _stage(1);
        collateral.approve(address(borrowing),3000e18);borrowing.deposit(3000e18);borrowing.borrow(8000e18);
        _stage(2);
        uint256 rest=collateral.balanceOf(address(this));collateral.approve(address(amm),rest);amm.swap(false,rest,1);
        _stage(3);
        require(stable.balanceOf(address(this))>=amount+fee+1e18,"INSUFFICIENT_RETURN");
        stable.approve(address(lender),amount+fee);
    }
    function _stage(uint8 step) private {
        emit Stage(step,amm.spotPrice(),stable.balanceOf(address(this)),collateral.balanceOf(address(this)));
    }
}
