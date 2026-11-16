#!/usr/bin/env python3
"""Generate the book's locale-specific SVG diagrams into public/diagrams/{zh,en}/.

All numbers shown come from the lab notebook (实验记录.md). Hash-like symbols such
as H(N) are explicitly symbolic; no real hash or address is invented here.
Run: npm run diagrams
"""
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parent.parent / "public" / "diagrams"
W, H = 960, 540
FONT = ("system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', "
        "'Noto Sans CJK SC', 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif")
MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace"
# Palette matches the site's light theme (一起玩 Web3): lavender paper, indigo ink,
# violet brand, mint-teal and amber/red for status. Text pairs keep >= 4.5:1.
C = dict(paper="#ffffff", paper2="#f3f1fd", ink="#1a1540", ink2="#3b3666", ink3="#55507e",
         rule="#c9c4e6", brand="#5a2be0", brandSoft="#ece7ff", teal="#0d6656", tealSoft="#e1f5ee",
         amber="#6b4700", amberSoft="#fdf1d6", amberLine="#b9861f", red="#a12a2a", redSoft="#fde6e3",
         grey="#77729f", greySoft="#eceaf6")


def t(x, y, s, size=18, weight=400, fill=C["ink"], anchor="start", mono=False, italic=False):
    fam = MONO if mono else FONT
    st = ' font-style="italic"' if italic else ""
    return (f'<text x="{x}" y="{y}" font-family="{escape(fam, quote=True)}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{st}>{escape(s)}</text>')


def lines(x, y, arr, size=18, gap=1.4, **kw):
    return "".join(t(x, y + i * size * gap, s, size=size, **kw) for i, s in enumerate(arr))


def box(x, y, w, h, fill=C["paper"], stroke=C["rule"], rx=12, sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def arrow(x1, y1, x2, y2, color=C["ink2"], sw=2.2, dash=None, head="a-ink"):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"{d} marker-end="url(#{head})"/>'


def path_arrow(d, color=C["ink2"], sw=2.2, head="a-ink", dash=None):
    ds = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}"{ds} marker-end="url(#{head})"/>'


def defs():
    def m(i, c):
        return (f'<marker id="{i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
                f'orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="{c}"/></marker>')
    return "<defs>" + m("a-ink", C["ink2"]) + m("a-brand", C["brand"]) + m("a-teal", C["teal"]) + m("a-grey", C["grey"]) + "</defs>"


def svg(name, lang, title, desc, body):
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
           f'role="img" aria-labelledby="t d" lang="{"zh-CN" if lang == "zh" else "en"}">'
           f'<title id="t">{escape(title)}</title><desc id="d">{escape(desc)}</desc>{defs()}'
           f'<rect width="{W}" height="{H}" fill="{C["paper"]}"/>{body}</svg>\n')
    p = OUT / lang / f"{name}.svg"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(doc, encoding="utf-8")


def heading(s, sub=None):
    out = t(40, 52, s, size=26, weight=700)
    if sub:
        out += t(40, 82, sub, size=17, fill=C["ink3"])
    return out


# ---------------------------------------------------------------- 1 blocks
def blocks(lang):
    zh = lang == "zh"
    b = heading("区块用「前一块的指纹」串成链" if zh else "Blocks are chained by the previous block's fingerprint",
                "示意图：H(…) 表示哈希（内容指纹），不是真实数值" if zh else "Illustration: H(…) means a hash (content fingerprint), not a real value")
    names = ["N−1", "N", "N+1"]
    xs = [40, 350, 660]
    for i, x in enumerate(xs):
        b += box(x, 120, 260, 250, C["paper2"], C["rule"], 16)
        b += t(x + 20, 156, ("区块 " if zh else "Block ") + names[i], 21, 700)
        prev = f"H({names[i-1]})" if i else ("H(N−2)")
        b += box(x + 16, 174, 228, 50, C["tealSoft"], C["teal"], 10)
        b += t(x + 28, 205, ("前一块指纹 " if zh else "Prev. hash ") + prev, 17, 600, C["teal"])
        b += box(x + 16, 236, 228, 70, C["paper"], C["rule"], 10)
        b += lines(x + 28, 264, ["交易列表" if zh else "Transactions", "时间等信息" if zh else "Timestamp, etc."], 17, fill=C["ink2"])
        b += box(x + 16, 316, 228, 40, C["brandSoft"], C["brand"], 10)
        b += t(x + 28, 342, ("本块指纹 " if zh else "This hash ") + f"H({names[i]})", 17, 700, C["brand"])
        if i < 2:
            b += path_arrow(f"M{x+244} 336 C {x+300} 336, {x+300} 199, {xs[i+1]+14} 199", C["brand"], 2.4, "a-brand")
    b += box(40, 398, 880, 112, C["amberSoft"], C["amberLine"], 14)
    if zh:
        b += lines(64, 432, ["改动区块 N−1 里的任何一个字 → H(N−1) 改变 → 区块 N 里记录的指纹对不上。",
                             "哈希让改动「容易被发现」；哪一条历史被接受，还要靠共识规则（以太坊用权益证明 PoS）。"], 18, gap=1.6, fill=C["amber"])
    else:
        b += lines(64, 432, ["Change one character in block N−1 → H(N−1) changes → block N no longer matches.",
                             "Hashes make edits easy to spot; consensus decides which history is accepted (PoS on Ethereum)."], 18, gap=1.6, fill=C["amber"])
    svg("blocks", lang,
        "区块、哈希与链" if zh else "Blocks, hashes and the chain",
        "三个区块从左到右排列。每个区块保存前一块的指纹、交易列表和本块指纹；箭头把前一块的指纹连到下一块。底部说明：改动旧区块会让后面的指纹对不上，但接受哪条历史由共识决定。" if zh else
        "Three blocks left to right. Each holds the previous block's hash, its transactions and its own hash; arrows link each hash into the next block. Note: editing an old block breaks the later fingerprints, but consensus decides which history is accepted.",
        b)


# ---------------------------------------------------------------- 2 wallet flow
def wallet_flow(lang):
    zh = lang == "zh"
    b = heading("一笔交易从签名到「看得见」" if zh else "A transaction from signing to \"visible\"")
    steps = [
        (("钱包", ["私钥只留在本地", "用它生成签名"]) if zh else ("Wallet", ["Private key stays", "local; makes the", "signature"]), C["brandSoft"], C["brand"]),
        (("已签名交易", ["to、数据、nonce、", "gas 参数 + 签名"]) if zh else ("Signed tx", ["to, data, nonce,", "gas fields", "+ signature"]), C["paper2"], C["rule"]),
        (("RPC 节点", ["校验签名与 nonce", "放进待处理队列", "（内存池）"]) if zh else ("RPC node", ["checks signature", "and nonce; holds", "it in the mempool"]), C["paper2"], C["rule"]),
        (("验证者出块", ["把交易打包进", "某个区块"]) if zh else ("Validator", ["includes the tx", "in a block"]), C["tealSoft"], C["teal"]),
        (("区块浏览器", ["Network · Status", "From / To · Logs", "Block · Hash"]) if zh else ("Explorer", ["Network · Status", "From / To · Logs", "Block · Hash"]), C["paper2"], C["rule"]),
    ]
    x = 40
    for i, ((title, ls), fill, stroke) in enumerate(steps):
        b += box(x, 130, 160, 200, fill, stroke, 14, 2 if stroke != C["rule"] else 1.5)
        b += t(x + 80, 128 - 14, str(i + 1), 18, 700, C["ink3"], "middle")
        b += t(x + 80, 170, title, 20, 700, C["ink"], "middle")
        b += lines(x + 80, 212, ls, 16, gap=1.45, fill=C["ink2"], anchor="middle")
        if i < 4:
            b += arrow(x + 162, 230, x + 188, 230)
        x += 190
    b += box(40, 362, 430, 148, C["amberSoft"], C["amberLine"], 14)
    b += box(490, 362, 430, 148, C["redSoft"], C["red"], 14)
    if zh:
        b += lines(62, 396, ["私钥从不发给节点或验证者。", "网络上传播的只是「签好名的交易」。", "连接钱包 ≠ 签名 ≠ 发送交易。"], 17, gap=1.6, fill=C["amber"])
        b += lines(512, 396, ["只在内存池、还没进区块的交易哈希", "不能当作事实。确认上链要看：", "网络、状态、From/To、日志、区块号。"], 17, gap=1.6, fill=C["red"])
    else:
        b += lines(62, 396, ["The private key is never sent to nodes.", "Only the signed transaction travels.", "Connect ≠ sign ≠ send a transaction."], 17, gap=1.6, fill=C["amber"])
        b += lines(512, 396, ["A hash still waiting in the mempool is not", "a fact. To confirm, check network, status,", "from/to, logs and the block number."], 17, gap=1.6, fill=C["red"])
    svg("wallet-flow", lang,
        "钱包签名、广播与区块浏览器" if zh else "Wallet signing, broadcast and the block explorer",
        "五个步骤：钱包用本地私钥签名；已签名交易；RPC 节点校验并放入内存池；验证者把交易打包进区块；区块浏览器显示网络、状态、发送方、接收方、日志、区块和哈希。提示：私钥不离开钱包；未打包的哈希不算事实。" if zh else
        "Five steps: the wallet signs with a local private key; the signed transaction; an RPC node checks it and holds it in the mempool; a validator includes it in a block; the explorer shows network, status, from, to, logs, block and hash. Notes: the key never leaves the wallet; an unmined hash is not a fact.",
        b)


# ---------------------------------------------------------------- 3 counter
def counter(lang):
    zh = lang == "zh"
    b = heading("Counter 的状态变化（Sepolia 上的真实顺序）" if zh else "Counter state changes (the real order on Sepolia)",
                "账户 A 的 nonce 0–4；每一步都是一笔已上链的交易" if zh else "Account A nonces 0–4; every step is a mined transaction")
    states = ["0", "1", "0", "1", "2"]
    ops = [("deploy", "", "nonce 0"), ("increment()", "", "nonce 1"), ("reset()", "owner only" if not zh else "仅 owner", "nonce 2"), ("increment()", "tip 1 wei", "nonce 3"), ("increment()", "tip 2 wei", "nonce 4")]
    xs = [70, 250, 430, 610, 790]
    for i, x in enumerate(xs):
        b += f'<circle cx="{x+50}" cy="215" r="44" fill="{C["tealSoft"] if i < 4 else C["brandSoft"]}" stroke="{C["teal"] if i < 4 else C["brand"]}" stroke-width="2.5"/>'
        b += t(x + 50, 229, states[i], 38, 700, C["teal"] if i < 4 else C["brand"], "middle")
        b += t(x + 50, 150, "count", 16, 600, C["ink3"], "middle", mono=True)
        b += t(x + 50, 290, ops[i][0], 15, 600, C["ink"], "middle", mono=True)
        if ops[i][1]:
            b += t(x + 50, 311, ops[i][1], 14.5, 600, C["brand"], "middle")
        b += t(x + 50, 332, ops[i][2], 14.5, 400, C["ink3"], "middle")
        if i < 4:
            b += arrow(x + 98, 215, x + 178 - 2, 215, C["ink2"])
    b += box(40, 356, 430, 158, C["paper2"], C["rule"], 14)
    b += box(490, 356, 430, 158, C["amberSoft"], C["amberLine"], 14)
    if zh:
        b += t(62, 386, "读：count() → 2", 19, 700, C["teal"], mono=False)
        b += lines(62, 418, ["eth_call 只读，不签名、不花 gas、", "不改变链上状态。", "写（increment / reset）才需要交易。"], 17, gap=1.55, fill=C["ink2"])
        b += t(512, 386, "回滚与历史", 19, 700, C["amber"])
        b += lines(512, 418, ["reset 只把数字清零，", "不会抹掉之前的交易和事件。", "reset 只有 owner（账户 A）能调用。"], 17, gap=1.55, fill=C["amber"])
    else:
        b += t(62, 386, "Read: count() → 2", 19, 700, C["teal"])
        b += lines(62, 418, ["eth_call is read-only: no signature,", "no gas, no state change.", "Writes (increment / reset) need a tx."], 17, gap=1.55, fill=C["ink2"])
        b += t(512, 386, "History stays", 19, 700, C["amber"])
        b += lines(512, 418, ["reset sets the number to 0 but does not", "erase earlier transactions or events.", "Only the owner (account A) may reset."], 17, gap=1.55, fill=C["amber"])
    svg("counter", lang,
        "Counter 合约的状态变化" if zh else "State changes of the Counter contract",
        "五个圆圈表示 count 的值：部署后 0，increment 后 1，reset 后 0，1 wei 小费的 increment 后 1，2 wei 小费的 increment 后 2。下方说明读操作免费、reset 不抹掉历史且只有 owner 能调用。" if zh else
        "Five circles show count: 0 after deploy, 1 after increment, 0 after reset, 1 after an increment with a 1 wei tip, 2 after an increment with a 2 wei tip. Notes: reads are free; reset does not erase history and only the owner may call it.",
        b)


# ---------------------------------------------------------------- 4 approve
def approve(lang):
    zh = lang == "zh"
    b = heading("授权 ≠ 付款：MBox-Burn 上 allowance(A, B) 的一生" if zh else "Approval ≠ payment: the life of allowance(A, B) on MBox-Burn",
                "A = 持有人，B = 被授权者（spender）。数字均来自实验记录" if zh else "A = holder, B = spender. All numbers come from the lab notebook")
    steps = [
        (["approve", "(B, 500)"], "A", "500", ["余额不变"] if zh else ["No balance", "change"]),
        (["burnFrom", "(A, 100)"], "B", "400", ["A −100", "供应 −100"] if zh else ["A −100", "supply −100"]),
        (["transferFrom", "(A→B, 100)"], "B", "300", ["A −100", "B +100"]),
        (["transferFrom", "(A→A, 200)"], "B", "100", ["净额 0", "仍有 Transfer 事件"] if zh else ["Net 0, still", "a Transfer event"]),
        (["approve", "(B, 0)"], "A", "0", ["撤销", "余额不变"] if zh else ["Revoked, no", "balance change"]),
    ]
    x = 40
    for i, (op, signer, allow, eff) in enumerate(steps):
        is_revoke = i == 4
        b += box(x, 118, 168, 250, C["tealSoft"] if is_revoke else (C["brandSoft"] if i == 0 else C["paper2"]),
                 C["teal"] if is_revoke else (C["brand"] if i == 0 else C["rule"]), 14, 2 if i in (0, 4) else 1.5)
        b += t(x + 84, 150, ("签名者 " if zh else "Signed by ") + signer, 15, 600, C["ink3"], "middle")
        b += lines(x + 84, 178, op, 15, gap=1.3, weight=700, fill=C["ink"], anchor="middle", mono=True)
        b += t(x + 84, 236, "allowance", 14, 600, C["ink3"], "middle", mono=True)
        b += t(x + 84, 282, allow, 42, 700, C["teal"] if is_revoke else C["brand"], "middle")
        b += lines(x + 84, 320, eff, 15, gap=1.35, fill=C["ink2"], anchor="middle")
        if i < 4:
            b += arrow(x + 170, 243, x + 186, 243)
        x += 180
    b += box(40, 392, 880, 118, C["amberSoft"], C["amberLine"], 14)
    if zh:
        b += lines(64, 426, ["approve 只写入「最多能代扣多少」的额度；真正动余额的是之后 B 发起的 burnFrom / transferFrom。",
                             "新的 approve 是覆盖，不是累加。不用了就 approve(spender, 0)，并在链上确认后才算撤销。",
                             "撤销交易：D-01，区块 12117312。"], 16.5, gap=1.6, fill=C["amber"])
    else:
        b += lines(64, 426, ["approve only sets the most B may move; balances change only when B calls burnFrom / transferFrom.",
                             "A new approve overwrites (it does not add). When done: approve(spender, 0), then wait until it is mined.",
                             "Revocation: D-01, block 12117312."], 16.5, gap=1.6, fill=C["amber"])
    svg("approve", lang,
        "授权、代扣与撤销" if zh else "Approve, transferFrom and revoke",
        "五个步骤：A 调用 approve(B,500)，额度 500，余额不变；B 调用 burnFrom(A,100)，额度 400；B 调用 transferFrom 把 100 转给 B，额度 300；B 调用 transferFrom 把 200 从 A 转给 A，额度 100；A 调用 approve(B,0) 撤销，额度 0。" if zh else
        "Five steps: A calls approve(B,500), allowance 500, balances unchanged; B calls burnFrom(A,100), allowance 400; B calls transferFrom moving 100 to B, allowance 300; B calls transferFrom moving 200 from A to A, allowance 100; A calls approve(B,0), allowance 0.",
        b)


# ---------------------------------------------------------------- 5 proxy
def proxy(lang):
    zh = lang == "zh"
    b = heading("代理 + 实现 + ProxyAdmin：门牌不变，后台可换" if zh else "Proxy + implementation + ProxyAdmin: same door, new back office")
    # user
    b += box(40, 120, 170, 96, C["paper2"], C["rule"], 14)
    b += t(125, 160, "用户 / 钱包" if zh else "User / wallet", 19, 700, anchor="middle")
    b += t(125, 190, "只认代理地址" if zh else "uses the proxy", 15, fill=C["ink3"], anchor="middle")
    b += arrow(212, 168, 268, 168)
    # proxy
    b += box(270, 110, 280, 190, C["brandSoft"], C["brand"], 16, 2.5)
    b += t(290, 146, "UBOX 代理（地址不变）" if zh else "UBOX proxy (fixed address)", 19, 700, C["brand"])
    b += t(290, 176, "0xc3F20D54…98db04", 16, 600, C["ink"], mono=True)
    b += lines(290, 212, ["存储：余额、授权、名称、scale" if zh else "Storage: balances, allowances,", "" if zh else "name, scale", ], 15.5, fill=C["ink2"])
    b += lines(290, 262, ["ERC-1967 实现槽 → 当前实现" if zh else "ERC-1967 slot → current impl."], 15.5, fill=C["ink2"])
    # delegatecall
    b += arrow(552, 205, 656, 205, C["teal"], 2.5, head="a-teal")
    b += t(603, 194, "delegatecall", 12.5, 700, C["teal"], "middle", mono=True)
    # implementations
    impls = [
        ("V1", "0xdaBaDC03…7300a", "代码仍在，已不被指向" if zh else "code remains, not used", C["greySoft"], C["grey"], None),
        ("V2", "0x0711Ef7C…E779F", "代码仍在，已不被指向" if zh else "code remains, not used", C["greySoft"], C["grey"], None),
        ("V3", "0x16E3D2f2…fad28", "当前实现（快照时）" if zh else "current (at snapshot)", C["tealSoft"], C["teal"], None),
        ("V4", "—", "仅本地 / fork 模拟，未上链" if zh else "local / fork sim only, not on-chain", C["paper"], C["grey"], "6 5"),
    ]
    y = 104
    for name, addr, note, fill, stroke, dash in impls:
        b += box(660, y, 260, 68, fill, stroke, 12, 2 if name == "V3" else 1.5, dash)
        b += t(676, y + 28, name, 18, 700, C["teal"] if name == "V3" else C["ink2"])
        b += t(712, y + 28, addr, 14, 500, C["ink"] if name == "V3" else C["ink2"], mono=True)
        b += t(676, y + 54, note, 14.5, 500, C["ink2"])
        y += 78
    # proxyadmin
    b += box(270, 336, 280, 104, C["paper2"], C["ink2"], 14, 2)
    b += t(290, 370, "ProxyAdmin", 19, 700)
    b += t(290, 398, "0x6DEAe6C7…0BBEE9", 15, 600, mono=True)
    b += t(290, 424, "owner = 账户 A" if zh else "owner = account A", 15.5, fill=C["ink2"])
    b += arrow(420, 334, 420, 304, C["ink2"], 2.4)
    b += t(432, 324, "upgradeAndCall", 13.5, 600, C["ink2"], mono=True)
    b += box(40, 460, 880, 58, C["amberSoft"], C["amberLine"], 12)
    b += t(60, 495, "每次升级都是公开交易，发出 Upgraded 事件；管理员能换规则，这是权力也是风险。" if zh else
           "Every upgrade is a public tx with an Upgraded event. The admin can change the rules: power and risk.", 16.5, 600, C["amber"])
    svg("proxy", lang,
        "代理、实现合约与 ProxyAdmin" if zh else "Proxy, implementation and ProxyAdmin",
        "用户调用固定的 UBOX 代理地址 0xc3F20D5488784D922aC3428a54125715fA98db04，代理保存余额等存储，并通过 delegatecall 执行当前实现 V3；V1、V2 的代码仍在但已不被指向；V4 只在本地。ProxyAdmin 的 owner 是账户 A，可以调用 upgradeAndCall 更换实现。" if zh else
        "Users call the fixed UBOX proxy 0xc3F20D5488784D922aC3428a54125715fA98db04. The proxy keeps balances and other storage and runs the current implementation V3 via delegatecall; V1 and V2 code remains but is no longer used; V4 is local only. ProxyAdmin, owned by account A, can call upgradeAndCall to switch implementations.",
        b)


# ---------------------------------------------------------------- 6 redenomination
def redenom(lang):
    zh = lang == "zh"
    b = heading("面额重标：10,000 旧单位 = 1 新单位" if zh else "Redenomination: 10,000 old units = 1 new unit",
                "存储不改写，读出时统一除以 scale；decimals 仍为 18" if zh else "Storage is not rewritten; reads divide by scale; decimals stays 18")
    b += box(40, 112, 360, 200, C["paper2"], C["rule"], 14)
    b += t(60, 146, "代理存储（原始值，旧单位）" if zh else "Proxy storage (raw, old units)", 18, 700)
    for i, (k, v) in enumerate([("A", "999,900 × 10¹⁸"), ("B", "100 × 10¹⁸"), ("supply", "1,000,000 × 10¹⁸")]):
        b += t(60, 186 + i * 30, k, 17, 600, C["ink2"], mono=True)
        b += t(380, 186 + i * 30, v, 17, 400, C["ink2"], "end", mono=True)
    b += arrow(402, 212, 548, 212, C["teal"], 2.6, head="a-teal")
    b += t(475, 198, "÷ scale 10000", 16, 700, C["teal"], "middle", mono=True)
    b += box(550, 112, 370, 200, C["tealSoft"], C["teal"], 14, 2)
    b += t(570, 146, "通过代理读取（新单位）" if zh else "Read via proxy (new units)", 18, 700, C["teal"])
    for i, (k, v) in enumerate([("balanceOf(A)", "99.99"), ("balanceOf(B)", "0.01"), ("totalSupply", "100")]):
        b += t(570, 186 + i * 30, k, 17, 600, C["ink"], mono=True)
        b += t(900, 186 + i * 30, v, 17, 700, C["teal"], "end", mono=True)
    b += t(570, 290, "decimals() = 18（未改）" if zh else "decimals() = 18 (unchanged)", 15.5, 600, C["ink2"])
    b += box(40, 336, 880, 176, C["redSoft"], C["red"], 14, 2)
    b += t(62, 370, "历史日志不会被改写" if zh else "Old logs are never rewritten", 19, 700, C["red"])
    b += lines(62, 404, ["成功批次留下的 Transfer(A → B, 100e18) 是旧单位。" if zh else "The successful batch left Transfer(A → B, 100e18) in old units.",
                         "若把它当成新单位来读：会以为 B 收到 100，实际 B 现在是 0.01 —— 大了 10,000 倍。" if zh else "Read as new units it says B got 100, but B now holds 0.01: 10,000× too large.",
                         "升级交易只发出 Upgraded 与 Redenominated(10000)，没有 Transfer（没有铸币或转账）。" if zh else "The upgrade emitted Upgraded and Redenominated(10000), and no Transfer (nothing minted or moved)."],
                    16.5, gap=1.65, fill=C["red"])
    svg("redenomination", lang,
        "UBOX V3 面额重标与历史事件" if zh else "UBOX V3 redenomination and historical events",
        "左边是代理存储中的原始值（旧单位）：A 999,900e18、B 100e18、总供应 1,000,000e18；除以 scale 10000 后，右边读出 A 99.99、B 0.01、总供应 100，decimals 仍为 18。下方警告：历史 Transfer 日志仍是旧单位，若按新单位读会大 10,000 倍。" if zh else
        "Left: raw proxy storage in old units, A 999,900e18, B 100e18, supply 1,000,000e18. Divided by scale 10000, the right side reads A 99.99, B 0.01, supply 100, with decimals still 18. Warning below: historical Transfer logs stay in old units and are 10,000 times too large if read as new units.",
        b)


# ---------------------------------------------------------------- 7 test layers
def tests(lang):
    zh = lang == "zh"
    b = heading("测试分层：每一层回答不同的问题" if zh else "Test layers: each answers a different question",
                "P0 复核（Foundry）的实际参数与结果" if zh else "Actual parameters and results of the P0 review (Foundry)")
    layers = [
        ("单元测试" if zh else "Unit tests", "49 / 49", "我想到的具体情况对不对？" if zh else "Do the cases I thought of behave?", 560),
        ("Fuzz", "9 / 9 × 1000 runs", "随机输入下断言还成立吗？（seed 0x5030）" if zh else "Do assertions hold for random inputs? (seed 0x5030)", 620),
        ("Invariant", "256 × 100 = 25,600", "任意调用序列后，4 条性质还成立吗？" if zh else "After any call sequence, do 4 properties hold?", 680),
    ]
    y = 112
    for i, (name, res, q, w) in enumerate(layers):
        x = 40 + (680 - w) // 2
        b += box(x, y, w, 84, [C["brandSoft"], C["paper2"], C["tealSoft"]][i], [C["brand"], C["rule"], C["teal"]][i], 14, 2)
        b += t(x + 22, y + 34, name, 19, 700)
        b += t(x + w - 22, y + 34, res, 17, 700, [C["brand"], C["ink"], C["teal"]][i], "end", mono=True)
        b += t(x + 22, y + 64, q, 15.5, 400, C["ink2"])
        y += 96
    b += box(740, 112, 180, 276, C["paper2"], C["rule"], 14)
    b += lines(756, 144, (["测试之外", "还要看：", "", "· 链上交易、", "  事件、存储", "· 源码匹配：", "  Sourcify 5 exact", "  + 3 match", "· Etherscan：", "  快照时仍排队"] if zh else
                          ["Beyond tests:", "", "· on-chain txs,", "  events, storage", "· source match:", "  Sourcify 5 exact", "  + 3 match", "· Etherscan:", "  still queued at", "  the snapshot"]), 15, gap=1.55, fill=C["ink2"])
    b += box(40, 412, 880, 100, C["amberSoft"], C["amberLine"], 14)
    if zh:
        b += lines(64, 448, ["全部通过 ≠ 没有漏洞：P0 仍记录了 1 个 Medium、3 个 Low、6 个 Info 发现。",
                             "batchTransferFrom 的 16 次 Handler 意外回退（约 0.5%）被视为测试脚手架残留，不是合约漏洞。"], 16.5, gap=1.65, fill=C["amber"])
    else:
        b += lines(64, 448, ["All green ≠ no bugs: P0 still recorded 1 Medium, 3 Low and 6 Info findings.",
                             "16 unexpected Handler reverts on batchTransferFrom (~0.5%) were treated as test-scaffold residue."], 16.5, gap=1.65, fill=C["amber"])
    svg("test-layers", lang,
        "单元测试、Fuzz 与 Invariant 测试分层" if zh else "Unit, fuzz and invariant test layers",
        "三层：单元测试 49/49 通过；Fuzz 9 项各 1000 次通过；Invariant 256 次运行乘 100 次调用共 25,600 次调用，4 条不变量通过。右侧提醒测试之外还要看链上证据和源码匹配。底部：全部通过不等于没有漏洞，仍有 1 Medium、3 Low、6 Info。" if zh else
        "Three layers: unit tests 49/49 pass; fuzz 9 tests × 1000 runs pass; invariant 256 runs × 100 calls = 25,600 calls with 4 invariants passing. Side note: beyond tests, check on-chain evidence and source matching. Bottom: all green does not mean no bugs; 1 Medium, 3 Low, 6 Info remain.",
        b)


# ---------------------------------------------------------------- OG image (SVG source; PNG rendered separately)
OG_W, OG_H = 1200, 630
OG_FONT = "'Plus Jakarta Sans Variable', 'Noto Sans SC Variable', " + FONT


def og(lang):
    zh = lang == "zh"

    def ot(x, y, s, size, weight, fill, anchor="start"):
        return (f'<text x="{x}" y="{y}" font-family="{escape(OG_FONT, quote=True)}" font-size="{size}" '
                f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{escape(s)}</text>')

    b = ('<defs>'
         '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f5fe"/><stop offset="1" stop-color="#ece7ff"/></linearGradient>'
         '<radialGradient id="g1" cx="0.1" cy="0.05" r="0.6"><stop offset="0" stop-color="#7a52ff" stop-opacity="0.30"/><stop offset="1" stop-color="#7a52ff" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="g2" cx="0.95" cy="0.9" r="0.55"><stop offset="0" stop-color="#ff7a59" stop-opacity="0.26"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></radialGradient>'
         '<linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b4dff"/><stop offset="1" stop-color="#4218c2"/></linearGradient>'
         '</defs>')
    b += f'<rect width="{OG_W}" height="{OG_H}" fill="url(#bg)"/><rect width="{OG_W}" height="{OG_H}" fill="url(#g1)"/><rect width="{OG_W}" height="{OG_H}" fill="url(#g2)"/>'
    # abstract geometric accents (no clip-art)
    b += '<rect x="985" y="60" width="150" height="150" rx="40" fill="url(#mk)" transform="rotate(12 1060 135)"/>'
    b += '<path d="M1038 100v70a5 5 0 0 0 7.6 4.3l56-35a5 5 0 0 0 0-8.6l-56-35a5 5 0 0 0-7.6 4.3Z" fill="#fff" transform="rotate(12 1060 135)"/>'
    b += '<circle cx="1135" cy="228" r="22" fill="#ff7a59" stroke="#fff" stroke-width="6"/>'
    b += '<circle cx="960" cy="560" r="90" fill="none" stroke="#5a2be0" stroke-opacity="0.14" stroke-width="22"/>'
    b += '<rect x="1080" y="470" width="54" height="54" rx="14" fill="#20c997" fill-opacity="0.35" transform="rotate(-14 1107 497)"/>'
    # wordmark
    lead, acc = ("一起玩", "Web3") if zh else ("Let’s Play", "Web3")
    b += (f'<text x="80" y="200" font-family="{escape(OG_FONT, quote=True)}" font-size="96" font-weight="800" letter-spacing="-2">'
          f'<tspan fill="#1a1540">{escape(lead)} </tspan><tspan fill="#5a2be0">{acc}</tspan></text>')
    sub = ["从生活理解区块链，", "再亲手在测试网上验证"] if zh else ["Understand blockchains through everyday", "life, then verify it on a testnet"]
    b += "".join(ot(80, 285 + i * 52, s_, 38, 600, "#3b3666") for i, s_ in enumerate(sub))
    pill = "仅 Ethereum Sepolia 测试网 · 预算 0 美元 · 不构成投资建议" if zh else "Ethereum Sepolia testnet only · $0 budget · Not financial advice"
    b += f'<rect x="80" y="420" width="{760 if zh else 880}" height="62" rx="31" fill="#ffffff" stroke="#c9c4e6" stroke-width="2"/>'
    b += f'<circle cx="114" cy="451" r="9" fill="#ff7a59"/>'
    b += ot(136, 460, pill, 25, 650, "#1a1540")
    foot = "中文 · English  ·  快照 2026-11-12 · 区块 12117419" if zh else "English · 中文  ·  Snapshot 2026-11-12 · block 12117419"
    b += ot(80, 556, foot, 24, 600, "#55507e")
    p = OUT.parent / "og" / f"{lang}.svg"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {OG_W} {OG_H}" width="{OG_W}" height="{OG_H}">{b}</svg>\n', encoding="utf-8")

if __name__ == "__main__":
    for lang in ("zh", "en"):
        for fn in (blocks, wallet_flow, counter, approve, proxy, redenom, tests, og):
            fn(lang)
    print("diagrams written to", OUT)
