# Rethinking Integration of Prediction and Planning in Deep Learning-Based Automated Driving Systems: A Review

[Rethinking Integration of Prediction and Planning in Deep...](https://arxiv.org/abs/2308.05731)

[AD论文1: 集成预测与规划综述](https://zhuanlan.zhihu.com/p/652977538)

[自动驾驶中基于深度学习的预测和规划融合方法综述-CSDN博客](https://blog.csdn.net/CV_Autobot/article/details/134544413)

[自动驾驶中基于深度学习的预测和规划融合方法综述](https://zhuanlan.zhihu.com/p/660532517)

# 摘要

摘要主要有三点信息：

- **模块化**的自动驾驶系统常把预测和规划作为连续但单独的任务（sequential separate tasks），这种方式没有考虑交通参与者（traffic participants）对自车行为的反应。
- 近期研究表明，集成预测和规划有助于提升驾驶性能。
- 本文系统性地回顾了最先进的（state-of-the-art，SOTA）**基于深度学习**（deep learning-based）的预测、规划以及综合预测和规划的模型。

# 引言

<img src="https://s2.loli.net/2024/01/15/1PxVspHTJ2WolSh.png" alt="Untitled" style="zoom: 50%;" />

- 解耦的预测和规划：这种顺序结构本质上是被动的（reactive），不能表示自车和其他智能体**连续的交互**
- 集成的预测和规划：可以表示自车和其他智能体**连续的交互**，这种方式称为 **Integrated Prediction and Planning (IPP)**

## 研究范围

- 关注基于深度学习的方法（DL-based methods）
- 关注智能体之间**没有直接或间接通信**的场景
- **不包含**行人行为的预测（pedestrian motion forecasting）
    - 行人相对于车辆动力学约束较弱，使得其行为预测是不同的问题

## 贡献和结构

- 回顾了预测、规划和IPP的SOTA方法benchmarks
- 对集成的预测和规划进行了分类，
- 分析了各类方法之间的联系，以及这些联系对安全性和鲁棒性的影响
- 揭示了SOTA方法的不足，并根据分类指出未来方向

# 自动驾驶系统

## 架构

DL-based自动驾驶系统（automated driving system, ADS）:

- 模块化（modular）
    - 包含感知、预测、规划和控制模块
    - 可利用专业领域的知识，使训练稳定且提升样本效率
    - 模块间的接口可提升可解释性和复用潜在特征（latent features）
        - 如果所有接口都可微，则可端到端训练
- 端到端（end-to-end）
    - 使用单个神经网络，简化设计过程
    - 无使用接口传递信息导致的信息损失
    - 样本效率和可解释性低
- 可解释（interpretable）的端到端
    - 缓解了样本效率和可解释性低的问题

## 任务定义

自车：Ego Vehicle (EV)

他车：Surrounding Vehicles (SV)

历史状态：$X_i=\{x_{t-t_{\text{obs}} },\ldots,x_{t-1},x_t\}$

$m$个他车历史状态：$\overline{\mathbf{X}}_{\mathrm{SV}}=\{X_1,X_2,\ldots,X_m\}$

未来状态：$Y_i=\{y_{t+1},y_{t+2},\ldots,y_{t+t_{\text{pred}}}\}$

$m$个他车未来状态：$\overline{\mathbf{Y}}_{\mathrm{SV}}=\{Y_1,Y_2,\ldots,Y_m\}$

环境/地图信息：$I$

**预测**：估计状态分布$P_{\mathrm{pred}}=P(\overline{\mathbf{Y}}|\overline{\mathbf{X}},I)$。

- 该分布从$\overline{\mathbf{X}}$中的$m$个观测到的车辆的历史状态映射至$\overline{\mathbf{Y}}$中的$n$个预测车辆的未来轨迹。
- $P_{\mathrm{pred}}$常建模为离散的各样本的分布律
- 部分方法省略$I$，只从历史状态推理未来轨迹

<img src="https://s2.loli.net/2024/01/15/coUhGs2QazHDvBf.png" alt="Untitled" style="zoom:67%;" />

预测可分为三种形式：

- Single-Agent Prediction：各个他车独立预测，不考虑交互
- Joint Prediction：考虑他车和所有车辆两两组合的交互，会导致维度爆炸
- Clique Prediction：只考虑和他车高度交互的车辆
    - Clique Prediction可视为Joint Prediction的特例

**规划**：找到自车的一条合适的轨迹，该轨迹可由下游的运动控制器跟踪。

- 不使用预测的轨迹：$Y_{\mathrm{EV}}=f(X_{\mathrm{EV}},\overline{\mathbf{X}}_{\mathrm{SV}},I)$
- 使用预测的轨迹：$Y_{\mathrm{EV}}=f(X_{\mathrm{EV}},\overline{\mathbf{X}}_{\mathrm{SV}},I,\overline{\mathbf{Y}}_{\mathrm{SV}})$

**预测vs规划**：

- 规划类似对自车的single-agent prediction，但不完全一样
- 规划中自车的意图已知，而预测中他车意图未知
- 自车要跟踪规划得到的轨迹，而他车不需要跟踪预测得到的轨迹
    - 规划重视轨迹的安全性（safety）和可行性（feasible），预测则次要考虑
    - 规划和预测的评价指标不同

![Untitled](https://s2.loli.net/2024/01/15/y63q2JQsmP5DAKh.png)

# 预测

## 场景表征（Scene Representation）

场景表征是提取场景中所有有用信息的子集，并处理为后续步骤可用的形式。

DL-based场景表征可分为：

- **栅格化**（Rasterized）表征：使用密集、固定分辨率的栅格结构，往往有多个通道（channel），每个通道编码不同的智能体状态，常结合高精地图（HD map）
    - 相关工作：
        - DESIRE，早期工作
        - 鸟瞰图（bird’s eye view, BEV），可多传感器融合并为所有车辆建立统一坐标系，便于考虑预测中的交互
    - 缺点：
        - 会因量化误差（quantization errors）导致信息丢失
        - 计算量大，内存需求高
        - CNN架构中，局部感知会限制对于交互的建模
- **稀疏**（Sparse）表征：关注少数关键对象，去除他冗余信息。
    - 图（Graphs）是常见的稀疏表征形式，使用折线、多边形或点集近似表示对象，在进一步编码为固定大小的潜在特征
        - 例如使用MLP、GNN、RNN
    - 交通图中，节点表示被编码的对象，边表示它们之间的关系
- 其他方法：
    - 栅格化+稀疏表征：通过对场景的不同方面进行编码
    - 使用体素（voxel）表示稀疏程度
    - [MultiPath](https://arxiv.org/abs/1910.05449)使用栅格化表征，[MultiPath++](https://arxiv.org/abs/2111.14973)使用稀疏表征
        - 二者对比说明稀疏化可提升性能，目前存在向稀疏化转变的趋势

<img src="https://s2.loli.net/2024/01/15/fj6VZpa5OTqGJy8.png" alt="Untitled" style="zoom:67%;" />

**坐标系**：

- **scene-centric**：a global coordinate system with a fixed viewpoint
    - 固定视角的全局坐标系
    - 视角移动降低样本效率和泛化性
- **agent-centric**：agent-centric per-agent coordinate systems
    - 各智能体都有一个自身视角的坐标系
    - 不用选视角位置，且坐标系姿态不变
    - 计算复杂度随智能体数量线性增长，随交互数量二次方增长
- **pairwise**：pairwise relative coordinate systems
    - 仅描述相邻智能体之间的关系
    - 视角不变，提升了泛化性和样本效率，大大减少计算量1
    - 部分工作支持Frenet坐标系
        - 使用统一的Frenet坐标系
        - 各智能体有各自的Frenet坐标系

**栅格化表征适合CNNs和RNNs，而稀疏表征适合GNNs、Attention机制和Transformers。**

## 交互建模（Interaction Modeling）

- **RNNs**
    - 早期工作：[DESIRE](https://arxiv.org/abs/1704.04394)、[Trajectron++](https://arxiv.org/abs/2001.03093)；结合RNNs和聚合算子（aggregation operator），如空间池化（spatial pooling）或者注意力机制（attention）
    - 先对每个智能体顺序建模+再聚合模型以处理交互
    - 先聚合信息+再联合顺序建模
- **CNNs**
    - 相关工作：[Fast and Furious](https://arxiv.org/abs/2012.12395)、[MTP](https://arxiv.org/abs/1809.10732)、Multipath；使用2D卷积来隐式捕获卷积核大小（kernel size）内的交互
- **GNNs和Attention**
    - 通过组合多个智能体的特征并使用图卷积算子（graph convolution operators）或软注意力（soft-attention）聚合信息，显式模拟各智能体之间的交互
    - 相关工作：[VectorNet](https://arxiv.org/abs/2005.04259)、[LaneGCN](https://arxiv.org/abs/2007.13732)、[TNT](https://arxiv.org/abs/2008.08294)、[HOME](https://arxiv.org/abs/2105.10968)、[DensteTNT](https://arxiv.org/abs/2108.09640)、[GOHOME](https://arxiv.org/abs/2109.01827)、[MultiPath++](https://arxiv.org/abs/2111.14973)
- **Transformers**
    - 相关工作：[InteractionTransformer](https://arxiv.org/abs/2008.05927)、[mmTransformer](https://arxiv.org/abs/2103.11624)、[AgentFormer](https://arxiv.org/abs/2103.14023)、[SceneTransformer](https://arxiv.org/abs/2106.08417)、[HiVT](https://ieeexplore.ieee.org/document/9878832)、[Wayformer](https://arxiv.org/abs/2207.05844)、[Motion Transformer](https://arxiv.org/abs/2209.13508)；利用了Transformers的全局感受野（global receptive field）和注意机制
    - 所有他车可以同时预测，并且可以建模不同时间步长下的车辆交互
    - 具有扩展能力，可以预测有多智能体的复杂场景

**时空交互**：

- 输入数据=时间分量+空间分量，时空数据可分别存储在输入张量（tensor）的各个维度中
- attention可在单一维度内或不同维度间进行
- 时空交互的attention方式：
    - 顺序（Sequentially）：先反复关注一个维度，在按顺序重复这一过程
        - 计算效率高，但是无法完全掌握时空交互（spatiotemporal interactions）
    - 联合（Joint）：同时关注时间和空间纬度
        - 计算负担大，但是能充分掌握时空交互
    - 交错（Interleaved）：时空维度交替进行
- [SceneTransformer](https://arxiv.org/abs/2106.08417)和[Wayformer](https://arxiv.org/abs/2207.05844)的实验表明在效果上**：交错>顺序>联合**

**局部和全局交互**：

- 局部注意力（local attention）：能捕获如避碰等即时行为
- 全局注意力（global attention）：能实现平滑且符合预期的驾驶行为
- 二者都有利于预测，且分层注意力（hierarchical attention）效果最后

## 轨迹解码（Trajectory Decoding）

预测的最后一步是生成轨迹。在DL-based的方法中，通过解码捕捉到的潜在特征生成轨迹。

**解码规则（Decoding principles）**：

- 相同的解码规则规划和IPP中都可使用
- 规划中，轨迹被解码为笛卡尔空间中动作序列
- 预测中，一般直接预测未来的路径点，少量工作预测动作序列
- 解码规则可分为**Single-shot**、**Two-shot**和**N-shot**
    - Single-shot分为**轨迹回归解码（Trajectory regression）**和**锚点轨迹分类（Anchor trajectory classification）**
        - 轨迹回归解码：使用神经网络把潜在特征直接解码为轨迹，如使用MLP
            - 易于应用在基于Transformer的架构中
            - 容易预测离开道路、弯道或在运动学上不可行的轨迹
            - 利用损失函数形式的先验知识可以限制解空间，缓解问题
        - 锚点轨迹分类：使用先验知识预定义锚点轨迹，并利用潜在特征中编码的信息对轨迹进行打分
            - 预定义的锚点轨迹可以确保可行性，并可施加硬运动学约束
            - 难以考虑罕见的轨迹，缺乏灵活性
    - Two-shot分为**端点和补全（endpoint and completion）**以及**初始轨迹和改进（initial trajectory and refine）**
        - 端点和补全：由于轨迹是为了实现上层的行为，因此轨迹包含的信息大部分在端点处
            - 端点可回归，也可从预定义的集合中分类得到
            - 基于分类的方法通常会额外回归分类端点的偏移量
            - [HOME](https://arxiv.org/abs/2105.10968)将端点概率分布输出为栅格化地图，并对潜在端点进行采样，中间的轨迹使用MLP补全
        - 初始轨迹和改进：直接分类轨迹而非端点，再改进得到的轨迹，如回归每个路径点的偏移量
            - 特殊情况：[TPNet](https://arxiv.org/abs/2004.12255)和[DCMS](https://arxiv.org/abs/2204.05859)先回归端点，再生成若干参考轨迹，之后修改轨迹
        - 将轨迹解码分为若干子任务，增加了可解释性，比锚点轨迹分类更灵活
        - 人为施加的约束可能会被改进步骤削弱
    - N-shot分为**初始轨迹和改进（initial trajectory and refine）**以及**自回归方式（autoregressive formulations）**
        - 初始轨迹和改进：在改进步骤使用循环优化（recurrent optimization），如DESIRE
        - 自回归方式：使用循环解码（recurrent decoding）迭代地逐步预测下一个路径点，并将包含预测结果的场景信息添加到潜在特征中
            - 可以帮助加强高质量的社交互动和场景理解
            - 可能导致复合误差（compounding errors），因为预测的结果会用于下一步预测
            - 计算量和耗时通常比One-shot和Two-shot高

<img src="https://s2.loli.net/2024/01/15/2RypfMw31NBkxL8.png" alt="Untitled" style="zoom:67%;" />

**随着基于Transformer的交互建模在预测中的兴起，轨迹回归解码成为最流行的方法**

**多模态（Multimodality）**：他车意图未知，未来的行为是不确定且多模态的，可使用离散轨迹集合（Discrete trajectory sets）和连续分布（Continuous distributions）表示

- 离散轨迹集合：可从中间分布中采样或通过模型设计得到
    - 中间分布中采样：输出的轨迹是路径点或者边界框（bounding boxes）序列
        - 可使用生成式的方法
        - 无法考虑所有情况
    - 模型设计：可以训练损失函数、熵最大化（entropy maximization）、基于方差的非极大值抑制（variance-based non-maximum suppression）、贪婪目标采样（greedy goal sampling）、分而治之策略（divide and conquer strategy）、均匀分布的目标状态（evenly spaced goal states）或使用预定义的锚轨迹（pre-defined anchor trajectories）
        - 只能手动定义上层行为或必须有至少一次预测的地图区域来保证覆盖
- 连续分布（Continuous distributions）
    - 与对象有关的表示：二元高斯分布（bi-variate Gaussian distributions），高斯混合模型（Gaussian Mixture Models），栅格化热图（rasterized heatmaps）
    - 与对象无关（object-agnostic）的表示：占用图（occupancy maps），流场（flow fields）
        - 表示方式更加自然，对扰动更加鲁棒
        - 没有为对象进行解码以获取离散轨迹，因此难以与专家日志进行比较以评估性能

## 基准测试（Benchmarks）

- 通过比较每个时间戳下预测的轨迹和测试集中他车真实的轨迹进行评估
- 不需要仿真，只需要记录的轨迹
- 常使用赢家通吃（winnertakes-all）的评估以考虑多模态性
    - 模型会输出固定数量的预测轨迹，且只采用最佳轨迹

# 规划

## 输入表征（Input Representation）

输入可分为**可解释的中间表征（interpretable intermediate representations）**和**潜在特征（latent features）**，包含$X_{\mathrm{EV}}$、$X_{\mathrm{SV}}$、$I$和可选的$\overline{\mathbf{Y}}_{\mathrm{SV}}$

- 可解释的中间表征：常用于模块化的ADS，利用感知模块输出的人工设计（hand-crafted）的场景表征进行规划
    - 需要考虑潜在工况的长尾分布（long-tailed distribution）
    - 接口处会丢失信息
- 潜在特征：常用于端到端（E2E）的ADS，直接从传感器信息映射至未来动作
    - 缺乏可解释性，难以定位故障
        - 可解释的E2E系统使用额外的中间表征缓解该问题，这些表征不用于规划，只用于监督（supervision）和模型自省（model introspection）

## 输出表征（Output Representation）

输出通常是**未来状态序列**或者**控制动作序列**

- 未来状态序列：由未来的$SE(2)$姿态序列表示，即2D的位置和朝向序列
    - 具有良好的可解释性
    - 由于状态序列和中间表征都定义在相同的笛卡尔空间中，故易于检查碰撞、违反交通规则和偏离可行驶区域的情况
    - 具体效果还取决于下游的控制器，若轨迹难以跟踪则规划效果会打折扣
- 未来动作序列：

## 目标调节（Goal Conditioning）

车道级（lane-level）的路线信息可由导航系统（navigation system）提供给规划器，该过程通常可分为三步：

1. 地图中的车道被标注为在路线上（on-route）或者在路线外（off-route）。该操作等价于提供一组构建路线的车道
2. 使用一组稀疏目标位置来描述路线。在Carla中，此类目标位置沿路线稀疏采样，以便在每步规划中向规划器提供最近的目标位置
3. 路线信息可以用上层指令表示（如“左转”或“直行”等语义动作）。该指令可从GPS获得

把上述目标信息用于规划算法共有四种方式：**输入特征（input features）**、**单独的子模块（separate submodules）**、**路线成本（routing cost）**和**路线注意力（route attention）**

- 输入特征：最直接的方法，并已被广泛采用
    - 车道是否在路线上的标注输入特征
        - 栅格地图中单独的语义通道
        - 描述车道中心线的矢量输入的附加标志位
    - 上层指令作为输入特征
        - 可使用[one-hot](https://arxiv.org/abs/2305.10430)编码上层指令
        - 在网络的不同阶段重复输入上层意图可以提高其泛化能力
        - [Transfuser](https://arxiv.org/abs/2205.15997)在最终的轨迹解码步骤中利用稀疏目标位置作为2D特征。
    - 无法保证目标符合要求
    - 该额外的输入可能并未起作用，而是其他潜在的假性相关（spurious correlations）在起作用
- 单独的子模块：只和上层指令一起使用，且子模块与各上层指令绑定，根据指令内容切换子模块
    - 无需去使用均衡数据集（balanced dataset），因各模块训练时和单个上层指令绑定
    - 需要预定义固定数量的上层指令
- 路线成本：通过优化人工设计的路线成本来规划轨迹
    - 倾向于规划更激进的轨迹，即目标跟踪越快越好
        - 目标位置稀疏时，可以通过到该目标的距离衡量跟踪进度
        - 车道有标注时，可以使用沿车道的进度或跟踪这些车道所需的变道次数衡量跟踪进度
    - 能够权衡各项指标，使规划器更灵活
- 路线注意力：是规划模型关注预期路线（intended route）
    - 可删除输入特征中偏离路线的部分
    - 可利用地图相关部分的空间注意力机制
    - 相关工作：[PDM-Open](https://arxiv.org/abs/2306.07962)、[GC-PGP](https://arxiv.org/abs/2302.07753)

## 规划范式（Planning Paradigms）

规划函数$f$可分为两部分：

- 方案生成器$g$：生成多个可能合适的轨迹$\hat{Y}_{\mathrm{EV}}^{(i)},\ i=1,\ldots,N_{\mathrm{proposals}}$
- 方案选择器$h$：选择最终方案$Y_{\mathrm{EV}}$
- 规划函数可表示为$f=h(g(X_{\mathrm{EV}},\overline{\mathbf{X}}_{\mathrm{SV}},I,\overline{\mathbf{Y}}_{\mathrm{SV}})$

规划可分为三种范式：**损失函数优化（Cost function optimization）**、**回归（Regression）**和**混合规划（Hybrid planning）**

- 损失函数优化：完全依赖选择器$h=\underset{i}{\operatorname*{argmin}}\ c\left(\hat{Y}_{\mathrm{EV}}^{(i)}\right)$，其中$c$表示轨迹成本
    - 生成器$g$可能只是生成运动学可行的轨迹的采样器
        - 随机采样可行的运动轨迹（motion profiles）
        - 聚类真实世界的专家经验数据（expert demonstrations）
    - 传统的人工设计损失函数难以应对长尾分布
    - 基于学习的方法从专家经验数据中学习损失函数
        - 损失函数可以是非参数的（non-parametric）
        - 可以只学习人工设计的损失函数的权重
- 回归：完全依赖生成器生成器$g$，其只生成一个方案$Y_{\mathrm{EV}}~=~\hat{Y}_{\mathrm{EV}}^{(1)}$
    - 选择器$h$是恒等式（identity）
    - 包含E2E方案
    - 使用行为克隆（behavior cloning，BC）的方式学习
        - 易受到分布偏移（distributional shifts）的影响，即遇到数据集未涵盖的情况时
    - 若输出未来状态，通常不能保证轨迹在运动学上可行
    - 若输出未来动作，可通过运动学模型传播动作获取轨迹，可能要裁减动作以保证运动学可行
- 混合规划：$g$生成一组轨迹+$h$选择最优轨迹

## 基准测试（Benchmarks）

评价规划的方式分为**开环评价（open-loop evaluation）**和**闭环仿真（closed-loop simulation）**

- 开环评价：将规划器输出$Y_{\mathrm{EV}}$与专家规划器$Y_{\mathrm{GT}}$的输出进行比
    - 规划器不控制自车
    - 忽略了复合误差和分布偏移导致的问题
    - 有工作表明开环评估结果与表现不相关
- 闭环仿真：
    - 规划器控制自车
    - 可能出现专家规划器未涵盖的情况
    - 高频重规划和不完美的跟踪可能使规划的轨迹$Y_{\mathrm{EV}}$和仿真的轨迹出$Y_{\mathrm{CL}}$不一致
        - 使用其他指标代替位移误差（displacement errors）
    - 需要实时控制他车
        - 日志回放（log-replay）为考虑交互，自车偏离专家日志（expert log）时可能导致碰撞，故仅限于短序列（short sequences）
        - 反应式仿真器（如[Carla](https://arxiv.org/abs/1711.03938)和[nuPlan](https://arxiv.org/abs/2106.11810)）基于他车的驾驶员模型，如[智能驾驶员模型（Intelligent Driver Model, IDM）](https://arxiv.org/abs/cond-mat/0002177)
        - 使用基于学习的方法来模拟真实的驾驶行为
- [Carla](https://arxiv.org/abs/1711.03938)仿真器数据集来源
    - 纯合成的数据集
        - 在真实世界中的泛化性成疑
    - 真实场景的记录
        - 提升了真实性以衡量平均性能
        - 罕见和关键的场景则欠考虑
            - 可以通过从驾驶日志自动生成测试用例来解决
    - 以对抗的方式增强场景中的参与者或场景本身生成关键场景
        - 可使用人机交互人工设计场景

# 集成预测和规划

<img src="https://s2.loli.net/2024/01/15/LhvGbYyNIZF3wnP.png" alt="Untitled" style="zoom:67%;" />

## 集成规则（Integration Principles）

<img src="https://s2.loli.net/2024/01/15/Sa1wfYV3nRFTd2r.png" alt="Untitled" style="zoom: 67%;" />

**完全的端到端（Monolithic E2E）**

- 把状态输入$\overline{\mathbf{X}}_{\mathrm{SV}},\ X_{\mathrm{EV}},\ I$直接映射到自车轨迹$Y_{\mathrm{EV}}$
- 没有对自车和他车的互动进行显式建模，但自车会隐式进行推理预测
- 该方案的设计旨在最小偏差（minimal bias），故对数据要求高以对抗高方差
- 黑盒属性（black-box nature）使得模型自省和安全验证困难

**可解释的端到端（Interpretable E2E）**

- 预测作为辅助学习任务，和规划任务一同训练
- 预测和规划共享编码特征的主干网络（backbone），但各自有解码各自输出的头部（heads）
- 额外的预测目标为主干网络提供了一个学习信号，其作为一种正则化（regularization）可提升样本效率和泛化性
- 额外的学些目标需要一个超参数（hyperparameter）权衡各项损失，且需要根据经验进行调节
- 增加了可解释性，有利于自省

完全的端到端和可解释的端到端都依赖于潜在空间（latent space）中的隐式预测，无法保证安全性

**手动集成（Manual integration）**

- 规划和预测使用独立的子系统，二者的交互基于专业领域的知识而设计
- 集成方式：
    - 先预测+后规划
    - 规划生成候选方案+对候选方案进行预测+选择最终方案
    - 迭代或同时进行预测和规划
- [PRECOG](https://arxiv.org/abs/1905.01296)
    - 使用概率模型（probabilistic model）进行一定条件下的多智能体预测
    - 联合自回归解码自车和他车的轨迹
    - 每一步中所有的和智能体都更新状态并作为其他智能体下一步的输入
    - 是超越了反应式行为（reactive behavior）的少数IPP模型之一
- [PiP](https://arxiv.org/abs/2003.11476)
    - 核心思想：他车根据自车的动作产生不同的行为
    - 生成独立于自车的候选规划方案+各方案进行预测+根据损失函数选择最优方案
- [DSDNet](https://arxiv.org/abs/2008.06041)
    - 结合端到端与模块化
    - 每个连续的神经网络都能获取感知主干网络的高维特征
    - 对他车预测一组潜在的轨迹
    - 设计损失函数量化自车候选轨迹和他车预测轨迹的碰撞概率，选择最优轨迹
- [P3](https://arxiv.org/abs/2008.05930)、[LookOut](https://arxiv.org/abs/2101.06547)、[MP3](https://arxiv.org/abs/2101.06806)
    - [P3](https://arxiv.org/abs/2008.05930)预测占用图（occupancy map）
    - [LookOut](https://arxiv.org/abs/2101.06547)使用预测轨迹去评估自车的候选轨迹
    - [MP3](https://arxiv.org/abs/2101.06806)使用包含检测和预测的“动态状态图”和目标路线共同评估轨迹，属于无图（mapless）方法
- [SafetyNet](https://arxiv.org/abs/2109.13602)
    - 并行使用具有隐式和显式预测的完全的E2E规划器
    - 在自车的规划和预测之间进行多次碰撞检查，若初始规划不安全则由回退层（fallback layer）生成沿车道的轨迹
- [SafePathNet](https://arxiv.org/abs/2211.02131)
    - 引入Transformer进行联合预测和规划
    - 预测多个自车的模式，并和他车最可能的预测进行碰撞检测并排名，选择最高分的模型
- [DIPP](https://arxiv.org/abs/2207.10422)
    - 联合预测所有智能体的轨迹，
    - 选择最高概率的轨迹作为微分非线性运动规划器（differential nonlinear motion planner）的输入
    - 规划器根据运动学模型和损失函数进行局部迭代优化
- [GameFormer](https://arxiv.org/abs/2303.05760)
    - 交互建模为level-k博弈
    - Transformer解码器根据上一级所有智能体的预测行为，迭代更新各智能体的预测，以建模所有智能体之间的交互
    - 可实现所有智能体的联合预测
- [UniAD](https://arxiv.org/abs/2212.10156)
    - 使用基于规划目标进行端到端训练的模块化系统
    - 接口设计为查询（Queries），则规划模块可关注之前网络层的智能体级（agent-level）特征
- [FusionAD](https://arxiv.org/abs/2308.01006)
    - 将感知包含在可端到端训练的模块化ADS中，所有模块都可以获取BEV级别的融合特征和前一个模块的输出
- 使用先验知识缩小了解空间，有更高的可解释性和安全性

## 自车和智能体的关系（Ego-to-Agents Relationship）

自车需要对周围智能体进行观测和预测来决策，也需要意识到它可以影响他人的行为。

自车和周围交通的交互可分为四类：**机器人领导者规划（Robot leader planning）**，**人类领导者规划（Human leader planning）**，**共同领导者规划（Co-leader planning）**和**联合规划（Joint planning）**

- 人类：周围交通；机器人：自车

**机器人领航者规划**：先规划自车轨迹，再根据规划结果预测环境

- 考虑了他车对自车轨迹做出的反应，但会导致激进的驾驶行为

**人类领航者规划**：先预测他车行为，再规划自车做出反应的轨迹

- 为考虑自车的规划对他车的影响，可能导致保守的驾驶行为

**联合规划**：所有车辆都考虑交互

- 通过对所有智能体进行全局优化而获得自车的规划
- 基于最优解存在的假设，IPP确定性地（deterministically）逼近联合优化目标
    - 需要假设他车的行为模型已知，不符合现实
    - 需要假设所有交通参与者都优化同一个全局目标，不符合现实

**共同领航者规划**：考虑他车潜在未来行为的影响和对潜在自车轨迹的反映

- 周围智能体行为不确定，采用主动应急降低不确定性
    - 被动应急（passive contingency）：自车需要规划应急方案进行以应对不确定性
    - 主动应急（active contingency）：自车考虑他车对自车潜在行为的反应

## 安全和应急（Safety and Contingency）

规划函数$f{=}h(g(X_{\mathrm{EV}},\overline{\mathbf{X}}_{\mathrm{SV}},I)$中需要考虑安全和应急规划

相关的未来场景数量$N_s$

他车在各场景中行为的多项式分布（multinomial distribution）$P\left(\overline{\mathbf{Y}}_{\mathrm{SV}}^{(i)}\right),i=1,..,N_{s}$

考虑安全和应急有三类方法：**边缘化预测的规划（planning with marginalized predictions）**、**最坏情况的规划（worst-case planning）**、**应急规划（contingency planning）**

**边缘化预测的规划**：不显式区分多个未来场景的IPP

- 预测$\mathbf{\overline{Y}}_{\mathrm{SV}}$由未来输出$\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)}$边缘化
    - 可显示进行，考虑场景概率，即$\overline{\mathbf{Y}}_{\mathrm{SV}}=\sum_{j}^{N_{s}}\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)}\cdot P\left(\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)}\right)$
    - 可隐式进行，联合表征所有可能的场景而非区分场景，如把预测纳入损失函数$h=\underset{i}{\mathrm{argmin}}\ c(Y_{\mathrm{EV}}^{(i)},\overline{\mathbf{Y}}_{\mathrm{SV}})$，在评估方案时不考虑单独的结果
        - 完全的端到端属于这一范畴
        - IPP假设所有的$N_s$个场景会在一定程度上同时发生，因此需要在可能性低但危险的场景和可能性高但损失小的场景之间权衡，该方式可认为安全

**最坏情况的规划**：意识到存在多个未来结果$\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)}$的IPP

- 认为所有的场景同等相关
- 各方案在最坏的场景中评估，以确保安全，故选择函数为$h=\underset{i}{\operatorname*{argmin}}\max_{j}c(Y_{\mathrm{EV}}^{(i)},\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)})$
- 会导致保守的驾驶行为
- 广泛应用于基于规则的安全层（如[RSS](https://arxiv.org/abs/1708.06374)），且可视为边缘化预测的规划和应急规划间的中间步骤

**应急规划**：考虑不同的未来场景$\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)}$及其概率$P(\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)})$应对未知的未来发展

- 可对冲最坏的情况，同时实现预期的进展
    - 基于损失函数和混合规划范式都可实现，选择函数的一般形式为$h=f_{c}(Y_{\mathrm{EV}}^{(i)},\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)},P(\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)}))$，其中$f_c$为应急选择函数（contingent selection function）
- 部分工作在短期考虑最坏的情况保障安全，在长期优化预期损失，因此$h=\underset{i}{\operatorname*{argmin}}\left(\max_{j}c_{s}(Y_{\mathrm{EV}}^{(i)},\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)})+\mathbf{E}_{j}[c_{l}(Y_{\mathrm{EV}}^{(i)},\overline{\mathbf{Y}}_{\mathrm{SV}}^{(j)})]\right)$，其中$c_s$和$c_l$为短期和长期的系数

## 可能的组合（Possible Combinations）

可以组合不同类别的方法，即上述的集成规则、安全和应急、自车和智能体的关系

- 集成规则关注上层系统架构
- 自车和智能体的关系基于系统架构下的交互行为
- 安全和应急关注最下层的选择候选方案的损失函数

**完全的端到端和可解释的端到端不兼容自车和智能体的关系范畴**

- 架构中没有显示反应预期交互行为的部分
- 可认为自车和智能体的关系未知
- 例如一个模仿学习专家经验数据的模型，该专家采用联合领航者和应急规划，但是该模型可能无法有效推理他车，从而表现出机器人领航者泛式的行为

**端到端模型不兼容安全和应急范畴**

- 端到端模型不使用预定义的人工设计的损失函数

**模块化系统通常能推理自车和智能体的关系，其集成架构可分为机器人领航者、人类领航者、共同领航者**

- 人类领航者规划遵循先预测、再规划的方案，未考虑自车规划对他车的影响，可与安全和应急类别中的任何一个组合
- 机器人领航者规划可与安全和应急类别中的任何一个组合
    - 考虑机器人领航者模型，该模型先规划自车潜在的方案，在对于每个方案预测他车，选择最终方案时可使用安全和应急类别中的任何一个作为损失函数
        - 现有的工作使用专门的成本函数，不遵循我们在第 2 节中概述的结构
    - 机器人领航者架构与相应的损失函数结合可能很有前途。
        - 特别最坏情况的损失函数，可缓解该架构下他车可能对自车利益做出不合理反应的问题
- 共同领航者规划会进行自车的应急规划，并意识到他车对自车的反应，故使用应急规划的损失函数
- 联合规划范式会优化所有交通参与者的联合成本函数，故不兼容安全和应急范畴

# 挑战

四大核心挑战：**大规模测试（testing at scale）**、**系统设计（system design）**、**综合基准测试（comprehensive benchmarking）**和**训练方法（training methods）**

大规模测试：

- 应对长尾分布
- 评估对抗鲁棒性（adversarial robustness）以识别对于分布偏移和分布外（out-of-distribution）的泛化能力的局限性

系统设计

- 传统的顺序组成的系统无法满足要求
- 目前还位置最优的集成架构，尤其是可解释的端到端系统，目前未知如何集成预测和规划

综合基准测试

- 有助于更好地理解不同的自车和智能体关系范畴与安全和应急范畴的影响
- 需要在真实且高度交互的场景中仿真，并使用真实的驾驶员模型和具有代表性的交互指标

训练方法

- 鲁棒性
- 对分布偏移的泛化能力
    - 纯模仿学习和强化学习有各自的缺点，可以考虑结合
    - 在可微分仿真器中使用行为克隆在线训练，但是需要可微分的仿真器
    - 使用增强场景（augmented scenes）