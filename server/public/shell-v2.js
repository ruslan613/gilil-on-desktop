/* Gilil On shell-v2 — self-contained demo SPA (mockup 2) */
(function () {
  'use strict';

  const ROLES = {
    admin: {
      key: 'admin',
      username: 'admin',
      nameKey: 'person.ruslan.full',
      shortKey: 'person.ruslan.short',
      roleKey: 'role.admin',
      company: 'Гелин',
      initials: 'РГ',
      teamKey: 'team.russia_msk',
      loginKey: 'login.admin',
      crmScope: 'full',
      password: 'admin123',
    },
    director: {
      key: 'director',
      username: 'director_ru',
      nameKey: 'person.igor.full',
      shortKey: 'person.igor.short',
      roleKey: 'role.director',
      company: 'Гелин',
      initials: 'ИД',
      teamKey: 'team.russia_msk',
      loginKey: 'login.demo_dir',
      crmScope: 'full',
      password: 'dir123',
    },
    ru: {
      key: 'ru',
      username: 'manager_ru',
      nameKey: 'person.alexey.full',
      shortKey: 'person.alexey.short',
      roleKey: 'role.ru_manager',
      company: 'Гелин',
      initials: 'АР',
      teamKey: 'team.russia_msk',
      loginKey: 'login.demo_ru',
      crmScope: 'ru',
      password: 'mgr123',
    },
    cn: {
      key: 'cn',
      username: 'director_cn',
      nameKey: 'person.lina.full',
      shortKey: 'person.lina.short',
      roleKey: 'role.cn_manager',
      company: 'Гелин',
      initials: 'LN',
      teamKey: 'team.china_sh',
      loginKey: 'login.demo_cn',
      crmScope: 'cn',
      password: 'dir123',
    },
  };
  let currentRole = 'ru';
  function DEMO_USER() {
    const base = ROLES[currentRole];
    return {
      ...base,
      name: t(base.nameKey),
      short: t(base.shortKey),
      role: t(base.roleKey),
      team: t(base.teamKey),
      login: t(base.loginKey),
    };
  }
  function isFullCrm() { return currentRole === 'admin' || currentRole === 'director'; }

  // ——— i18n (UI language; selector lives in Settings) ———
  let currentLang = 'zh';
  /** Codes available in Settings. Full string packs: zh/ru/en; others fall back to EN chrome. */
  const UI_LANGS = [
    { code: 'ru', label: 'Русский', native: 'Русский', rtl: false },
    { code: 'zh', label: '中文', native: '中文（简体）', rtl: false },
    { code: 'en', label: 'English', native: 'English', rtl: false },
  ];
  const UI_LANG_CODES = new Set(UI_LANGS.map((x) => x.code));
  function isUiLang(code) { return UI_LANG_CODES.has(String(code || '').toLowerCase()); }
  function langMeta(code) {
    return UI_LANGS.find((x) => x.code === code) || UI_LANGS[0];
  }
  const I18N = {
    zh: {
      "login.enter": "以员工身份进入",
      "login.enter_demo": "演示进入（无密码）",
      "login.hint": "演示登录：<strong>ru1 · 阿列克谢 · RU Manager</strong> · 无需密码",
      "login.sub": "Lighting Supply CN ↔ RU · 邮箱验证码登录",
      "login.email": "邮箱",
      "login.code": "邮件中的验证码",
      "login.send_code": "发送验证码",
      "login.verify": "登录",
      "login.resend": "重新发送",
      "login.code_sent": "验证码已发送",
      "login.code_sent_mock": "开发模式：验证码",
      "login.enter_code": "请输入 6 位验证码",
      "login.bad_code": "验证码无效",
      "login.wait_resend": "请等待 {sec} 秒后重发",
      "login.sending": "发送中…",
      "login.verifying": "验证中…",
      "login.remember": "记住我",
      "nav.personal": "个人",
      "nav.crm": "CRM",
      "nav.leads": "申请",
      "leads.pick": "请选择左侧申请",
      "leads.empty": "暂无网站申请",
      "leads.source": "来源",
      "leads.source.website": "网站",
      "leads.kind": "类型",
      "leads.kind.client_order": "客户订单",
      "leads.kind.tender": "招标",
      "leads.status": "状态",
      "leads.status.new": "新建",
      "leads.status.in_progress": "进行中",
      "leads.status.closed": "已关闭",
      "leads.filter.all": "全部",
      "leads.message": "留言",
      "leads.company": "公司",
      "leads.contact": "联系方式",
      "leads.date": "日期",
      "leads.project_type": "项目类型",
      "leads.set_status": "状态 →",
      "leads.load_err": "无法加载申请（需登录）",
      "nav.tenders": "招标",
      "nav.news": "新闻",
      "nav.tv": "TV",
      "nav.storage": "存储",
      "nav.supply": "Gilil Supply",
      "supply.hint": "Stage 2 · JWT · WS · 8797",
      "supply.reload": "Обновить",
      "nav.chats": "聊天",
      "nav.mail": "邮件",
      "nav.funnel": "订单漏斗",
      "nav.activity": "活动日志",
      "nav.usefulness": "效用系数",
      "nav.tasks_plans": "任务与计划",
      "nav.calendar": "日历",
      "cal.add": "+ 添加事件",
      "cal.today": "今天",
      "cal.day_empty": "这一天没有事件",
      "cal.modal_title": "添加事件",
      "cal.modal_hint": "标题 · 日期 · 时间 · 项目或任务",
      "cal.lbl_title": "标题",
      "cal.lbl_date": "日期",
      "cal.lbl_time": "时间",
      "cal.lbl_project": "项目",
      "cal.lbl_task": "任务",
      "cal.save": "保存",
      "cal.cancel": "取消",
      "cal.added": "事件已保存",
      "cal.deleted": "事件已删除",
      "cal.delete": "删除",
      "cal.link_project": "项目",
      "cal.link_task": "任务",
      "cal.no_link": "无关联",
      "cal.weekday.0": "一",
      "cal.weekday.1": "二",
      "cal.weekday.2": "三",
      "cal.weekday.3": "四",
      "cal.weekday.4": "五",
      "cal.weekday.5": "六",
      "cal.weekday.6": "日",
      "cal.months": "一月,二月,三月,四月,五月,六月,七月,八月,九月,十月,十一月,十二月",
      "tp.add": "+ 添加任务",
      "tp.sub": "任务与计划分析 · 名称 · 状态 · 期限 · 负责人",
      "tp.col_name": "任务",
      "tp.col_status": "状态",
      "tp.col_due": "期限",
      "tp.col_owner": "负责人",
      "tp.empty": "暂无任务",
      "tp.status_done": "已完成",
      "tp.status_overdue": "逾期",
      "tp.status_progress": "进行中",
      "tp.status_invoice": "账单",
      "tp.owner_default": "阿列克谢",
      "tp.added": "已添加任务",
      "tp.new_title": "新任务",
      "tp.new_desc": "手动添加",
      "nav.mail_stats": "邮件统计",
      "nav.tier.crm": "CRM",
      "nav.tier.media": "媒体",
      "nav.tier.mail": "邮件",
      "nav.tier.more": "更多",
      "nav.tier.team": "团队",
      "personal.who": "我是谁",
      "personal.lbl_name": "姓名",
      "personal.lbl_role": "角色",
      "personal.lbl_company": "公司",
      "personal.lbl_team": "团队 / 城市",
      "personal.lbl_login": "登录名",
      "personal.tasks_summary": "任务汇总",
      "personal.today": "今天",
      "personal.stat_active": "进行中",
      "personal.stat_wait": "待审批",
      "personal.stat_overdue": "已逾期",
      "personal.stat_done": "已完成",
      "personal.demo_note": "任务<strong>不</strong>在顶部菜单 — 徽标在「个人」上，右下角红色按钮。今日未勾选的任务标红。",
      "personal.plan_today": "今日计划",
      "personal.plan_hint": "勾选 → 总监机器人",
      "personal.plan_note": "✓ 勾选立即发给总监机器人（演示：toast「已发送给总监机器人」）。",
      "personal.tasks_today": "今日任务",
      "personal.tasks_hot": "标红提醒",
      "personal.filter_all": "全部",
      "personal.filter_regular": "普通",
      "personal.filter_invoice": "账单",
      "personal.demo_beep": "演示：蜂鸣（逾期 >1小时）",
      "personal.open_first": "打开第一个任务",
      "personal.new_invoice": "+ 新建账单",
      "personal.director_rating": "总监评价",
      "personal.lbl_score": "评分",
      "personal.lbl_director_comment": "总监评论",
      "personal.lbl_score_at": "评价日期",
      "personal.lbl_hire_date": "入职日期",
      "personal.lbl_time_in_app": "在程序中的时间",
      "theme.gear_title": "设置",
      "theme.title": "界面主题",
      "theme.settings": "设置",
      "settings.manual": "Gilil On 使用说明",
      "settings.manual_missing": "使用说明文件尚未就绪，稍后会出现在程序目录中",
      "theme.label": "界面主题",
      "theme.hint": "选择会保存在浏览器本地（localStorage）。",

      "pcard.company": "公司",
      "pcard.tender_no": "招标编号",
      "pcard.description": "说明",
      "pcard.curator": "负责人",
      "pcard.docs": "文件",
      "pcard.manager": "经理",
      "pcard.save": "保存",
      "pcard.plan_status": "计划执行状态",
      "pcard.plan_on_track": "按计划",
      "pcard.plan_behind": "落后",
      "pcard.plan_done": "已完成",
      "pcard.plan_meta": "{done}/{total} 任务 · 逾期 {overdue}",
      "lang.label": "界面语言",
      "notif.title": "通知",
      "notif.read_all": "全部已读",
      "notif.sound": "通知声音",
      "update.available": "有可用更新",
      "update.available_ver": "有可用更新 · v{ver}",
      "update.download": "下载",
      "update.downloading": "正在下载… {pct}%",
      "update.ready": "更新已下载",
      "update.install": "安装并重新启动",
      "update.error": "更新错误：{err}",
      "notif.empty": "暂时安静",
      "notif.empty_sub": "新消息、任务和账单会出现在这里",
      "notif.tab.all": "全部",
      "notif.tab.message": "消息",
      "notif.tab.task": "任务",
      "notif.tab.invoice": "账单",
      "notif.type.message": "消息",
      "notif.type.task": "任务",
      "notif.type.invoice": "账单",
      "notif.type.lead": "线索",
      "notif.type.mail": "邮件",
      "theme.dark": "深色",
      "theme.cyan": "移动 · Cyan",
      "theme.blue": "移动 · Cyan",
      "theme.bitrix": "Bitrix24 浅色",
      "theme.beige": "Bitrix",
      "toast.theme": "主题：{name}",
      "crm.admin": "管理后台",
      "crm.admin_hint": "用户与设置管理 — 仅管理员（鲁斯兰）。",
      "crm.users": "用户",
      "smtp.allowlist_title": "SMTP 邮箱访问",
      "smtp.allowlist_hint": "仅列表中的地址可通过共享邮箱接收 OTP。不显示 App Password。",
      "smtp.email_ph": "email@example.com",
      "smtp.label_ph": "备注",
      "smtp.add": "添加",
      "smtp.remove": "删除",
      "smtp.deactivate": "停用",
      "smtp.activate": "启用",
      "smtp.empty": "白名单为空",
      "smtp.saved": "已保存",
      "smtp.err": "错误：{err}",
      "smtp.active": "有效",
      "smtp.inactive": "停用",
      "tenders.bar": "招标 · 内嵌面板",
      "tenders.open": "单独打开 ↗",
      "tenders.crm": "招标 CRM ↗",
      "news.bar": "新闻",
      "news.open": "打开 news.html ↗",
      "tv.bar": "CRM TV 大屏",
      "tv.open": "打开 crm-tv.html ↗",
      "tv.title": "CRM TV",
      "tv.desc": "招标漏斗大屏展示。下方为预览；完整全屏见链接。",
      "storage.mine": "我的存储",
      "storage.mine_hint": "ru1 项目",
      "storage.mine_desc": "按项目分类：<span class=\"proj-chip order\">client_order</span> 客户订单 · <span class=\"proj-chip tender\">tender</span> 招标",
      "storage.shared": "RU 共享文件夹",
      "storage.shared_hint": "自动整理",
      "storage.shared_desc": "文档类型 + 文件夹 <code style=\"color:var(--teal)\">tenders/&lt;编号&gt;/</code>",
      "chats.select": "请选择左侧对话",

      "tfc.title": "从聊天创建任务",
      "tfc.hint": "无需离开对话即可创建任务",
      "tfc.lbl_title": "标题",
      "tfc.lbl_desc": "描述",
      "tfc.lbl_assignee": "执行人",
      "tfc.notify": "通知执行人",
      "tfc.submit": "创建任务",
      "tfc.cancel": "取消",
      "tfc.btn": "任务",
      "tfc.sel_tip": "创建任务",
      "tfc.ok": "任务已创建",
      "tfc.fail": "无法创建任务",
      "cmdk.ph": "搜索：对话、任务、账单、项目…",
      "cmdk.empty": "未找到结果",
      "cmdk.foot": "↑↓ 选择 · Enter 打开 · Esc 关闭",
      "cqr.label": "状态：",
      "cqr.read": "已读",
      "cqr.replied": "已回复",
      "cqr.in_progress": "进行中",
      "cqr.done": "完成",
      "cqr.set": "状态已更新：{status}",
      "cqr.fail": "无法更新状态",
      "chats.search": "搜索对话（RU / CN / 项目）…  ⌘K",
      "chats.msg_search": "按文本搜索…",
      "chats.from": "自",
      "chats.to": "至",
      "chats.media": "📎 媒体",
      "chats.photo": "🖼 图片",
      "chats.clear": "重置",
      "chats.input": "消息…",
      "chats.send": "发送",
      "chats.policy": "规则：RU 不可见 CN 价格 · CN 不可见 RU 价格 · 联系方式仅通过程序卡片",
      "chats.team_ru": "RU 团队",
      "chats.team_cn": "CN 团队",
      "chats.teams_both": "两个团队",
      "chats.team_vis": "显示团队",
      "chats.projects": "项目",
      "chats.director": "管理层",
      "chats.no_match": "无匹配结果",
      "chats.auto_tr": "译",
      "chats.no_filter": "无符合筛选的消息 · 请重置搜索 / 日期 / 媒体",
      "chats.voice": "语音",
      "chats.voice_cancel": "取消",
      "chats.voice_stop": "停止",
      "chats.voice_send": "发送语音",
      "chats.voice_to_text": "转文字",
      "chats.voice_rec": "录音中…",
      "chats.voice_need_https": "麦克风需要 HTTPS 或 localhost",
      "chats.voice_denied": "未授权麦克风",
      "chats.voice_stt_fail": "无法转写 · 请再说一次或手动输入",
      "chats.voice_sent": "语音已发送",
      "chats.dictation": "🎤 听写",
      "chats.dictation_mail": "🎤 听写到草稿",
      "chats.voice_dur": "{s}秒",
      "chats.voice_zh": "中文",
      "chats.voice_transcribing": "转写中…",
      "mail.sync": "同步",
      "mail.templates": "模板",
      "mail.in": "收件箱",
      "mail.out": "已发送",
      "mail.waiting": "待回复",
      "mail.day": "日",
      "mail.week": "周",
      "mail.month": "月",
      "mail.by_managers": "按经理",
      "mail.by_projects": "按项目（瓶颈）",
      "mail.dynamics": "动态",
      "fab.tasks": "任务",
      "fab.tasks_title": "今日任务",
      "lang.switched": "界面语言：中文",
      "mail.mode_ph": "模式…",
      "price.cn_redact": "[中侧价格已隐藏]",
      "price.ru_redact": "[俄侧价格已隐藏]",
      "price.cn_hidden": "中侧价格对您的角色隐藏",
      "price.ru_hidden": "俄侧价格对您的角色隐藏",
      "price.cn_lbl": "中侧价格",
      "price.ru_lbl": "俄侧价格",
      "leak.msg": "消息未送达：禁止在程序外交换联系方式（{reason}{matched}）。请使用 CRM / 供应商卡片。",
      "media.photo": "图片",
      "media.file": "文件",
      "leak.phone": "电话",
      "leak.email": "邮箱",
      "leak.wechat": "微信",
      "leak.telegram": "Telegram",
      "leak.bypass": "绕过联系方式",
      "leak.empty": "空消息",
      "leak.blocked": "消息未送达：禁止在程序外交换联系方式（",
      "person.ruslan.full": "鲁斯兰·吉利利",
      "person.ruslan.short": "鲁斯兰",
      "person.igor.full": "伊戈尔·季列克托罗夫",
      "person.igor.short": "伊戈尔",
      "person.alexey.full": "阿列克谢·彼得罗夫",
      "person.alexey.short": "阿列克谢",
      "person.lina.full": "李娜",
      "person.lina.short": "李娜",
      "person.maria_k": "玛丽亚·K.",
      "person.dmitry_s": "德米特里·S.",
      "person.anna_p": "安娜·P.",
      "person.alexey_r": "阿列克谢·R.",
      "person.wang_li": "王丽",
      "person.zhang_wei": "张伟",
      "person.ivanov": "伊万·伊万诺夫",
      "person.smirnova": "安娜·斯米尔诺娃",
      "person.volkov": "彼得·沃尔科夫",
      "role.admin": "管理员 · 所有者",
      "role.director": "总监",
      "role.ru_manager": "RU Manager",
      "role.cn_manager": "CN Manager",
      "role.chat.ru_mgr_msk": "RU Manager · 莫斯科 MSK",
      "role.chat.sales_yekt": "销售经理 · 叶卡捷琳堡 YEKT",
      "role.chat.pm_novt": "项目经理 · 新西伯利亚 NOVT",
      "role.chat.support_msk": "支持主管 · 莫斯科 MSK",
      "role.chat.cn_sales": "CN 销售总监 · 上海 CST",
      "role.chat.factory": "工厂经理 · 中山 CST",
      "role.chat.supply": "供应计划 · 上海 CST",
      "role.chat.dir_msk": "总监 · 莫斯科 MSK",
      "role.chat.owner_msk": "所有者 · 莫斯科 MSK",
      "role.chat.igor_dir": "伊戈尔 · 总监",
      "role.chat.ruslan_admin": "鲁斯兰 · 管理员",
      "team.russia_msk": "俄罗斯 · 莫斯科 (MSK)",
      "team.china_sh": "中国 · 上海 (CST)",
      "login.admin": "admin（管理员）",
      "login.demo_dir": "dir1（演示）",
      "login.demo_ru": "ru1（演示）",
      "login.demo_cn": "cn1（演示）",
      "company.alfa": "阿尔法照明有限公司",
      "company.frunze": "弗龙泽住宅小区",
      "company.seversvet": "北方之光有限公司",
      "company.zs_factory": "中山 LED 工厂 · Phase 2",
      "company.sh_supply": "上海供应 · Spot 模组",
      "project.frunze_lights": "弗龙泽小区灯具订单",
      "project.retail": "Retail lighting",
      "project.street": "Street lights",
      "project.b2b": "B2B platform",
      "project.iot": "IoT solution",
      "project.tender_b2b": "B2B lighting",
      "chat.pr.frunze": "弗龙泽住宅小区",
      "chat.pr.t466": "招标 4661969",
      "chat.pr.2025ru": "2025-RU",
      "chat.pr.cn2": "Project CN-Phase 2",
      "chat.pr.led": "LED Platform",
      "chat.pr.iot": "Control Hub",
      "plan.p1.title": "晨间招标概览",
      "plan.p1.meta": "10:00 前",
      "plan.p2.title": "阿尔法照明报价 → 客户",
      "plan.p2.meta": "任务 t1 · 15:00 前",
      "plan.p3.title": "联系 CN 弗龙泽样品",
      "plan.p3.meta": "王丽 / 李娜",
      "plan.p4.title": "整理文档到 shared RU",
      "plan.p4.meta": "规格 / 报价 / 账单",
      "task.t1.title": "发送阿尔法照明最终报价",
      "task.t1.desc": "最终报价在 shared RU → kp/。在计划中勾选。",
      "task.t2.title": "提醒样品 · 弗龙泽小区",
      "task.t2.desc": "已约定明日 11:00。准备 CN 运单。",
      "task.t3.title": "上传含再竞标规格 · 招标 4661969",
      "task.t3.desc": "文件在 shared/ru/tenders/4661969/…",
      "task.t4.title": "与 CN 确认 Control Hub 工期",
      "task.t4.desc": "上午已关闭。",
      "inv.inv1.title": "账单 · 阿尔法照明有限公司",
      "inv.inv1.desc": "按最终报价付款 · 仓库照明",
      "inv.inv2.title": "账单 · 弗龙泽住宅小区",
      "inv.inv2.desc": "预付 30% · 灯具订单",
      "invoice.title_prefix": "账单",
      "inv.step.manager": "经理",
      "inv.step.director": "总监",
      "inv.step.ruslan": "鲁斯兰",
      "status.invoice_pending_manager": "等待经理",
      "status.invoice_pending_director": "等待总监",
      "status.invoice_pending_ruslan": "等待鲁斯兰",
      "status.invoice_approved": "已批准",
      "status.invoice_rejected": "已拒绝",
      "status.invoice_fallback": "账单",
      "task.badge.done": "已关闭",
      "task.badge.overdue": "今日 · >1小时",
      "task.badge.progress": "进行中",
      "task.empty_filter": "此筛选下无任务",
      "task.created_by": "创建人",
      "task.taken": "接手",
      "task.closed": "关闭",
      "tm.close_aria": "关闭",
      "tm.default_title": "任务",
      "tm.lbl_company": "公司",
      "tm.lbl_amount": "金额",
      "tm.lbl_invno": "账单号",
      "tm.lbl_creator": "创建人",
      "tm.lbl_taken": "接手时间",
      "tm.lbl_closed": "勾选关闭",
      "tm.regular_hint": "勾选会发给总监机器人。超过 1 小时未勾选 — 声音提醒。",
      "tm.check_on": "勾选完成",
      "tm.check_off": "取消勾选",
      "tm.beep": "蜂鸣（演示）",
      "tm.close": "关闭",
      "tm.approve": "批准",
      "tm.reject": "拒绝",
      "tm.status_all_ok": "全部批准 · 允许付款",
      "tm.status_stopped": "已拒绝 · 流程停止",
      "tm.need_ru": "RU（经理）",
      "tm.need_dir": "总监",
      "tm.need_admin": "管理员（鲁斯兰）",
      "tm.switch_role": " · 请将角色切换为 {need}（右上角按钮）",
      "invcreate.title": "新建账单",
      "invcreate.chain": "流程：经理 → 总监 → 鲁斯兰",
      "invcreate.company": "收款公司",
      "invcreate.amount": "金额 (₽)",
      "invcreate.desc": "编号 / 账单说明",
      "invcreate.submit": "创建账单",
      "invcreate.cancel": "取消",
      "invcreate.ph_company": "有限公司 …",
      "invcreate.ph_desc": "INV-2026-050 · 按报价付款",
      "inv.alert": "请确认付款账单审批 <strong>{company}</strong>，金额 <strong>{amount}</strong>",
      "inv.alert_open": "打开",
      "inv.beep": "🔔 请确认付款账单审批 {company}，金额 {amount}",
      "beep.overdue": "🔔 提醒：任务超过 1 小时未勾选",
      "toast.lang": "",
      "toast.role": "演示角色：{short} · {role}",
      "toast.entered": "已登录为 {login} · {short} · {role}",
      "toast.plan_on": "✓ 计划：「{title}」→ 已发给总监机器人",
      "toast.plan_off": "已取消勾选 · 已通知总监机器人回退",
      "toast.task_on": "✓ 任务已关闭 → 已发给总监机器人",
      "toast.task_off": "任务重新打开 · 已通知总监机器人",
      "toast.no_right": "此步骤无权限 · 请切换演示角色",
      "toast.mgr_ok": "✓ 经理已批准 → 总监",
      "toast.dir_ok": "✓ 总监已批准 → 鲁斯兰",
      "toast.ruslan_ok": "✓ 鲁斯兰已批准账单 · 状态「已批准」",
      "toast.inv_rej": "✕ 账单已拒绝 · 流程停止",
      "toast.inv_created": "账单已创建 · 等待经理",
      "toast.inv_need": "请填写公司与金额",
      "toast.admin_only": "管理后台仅限管理员角色",
      "toast.admin_users": "管理后台 · 用户（演示）：admin / dir1 / ru1 / cn1",
      "toast.tpl_deny": "模板由 admin/director 编辑",
      "toast.tpl_count": "模板数：{n}（通过 API / admin 编辑）",
      "toast.chat_filters": "聊天筛选已重置",
      "toast.contact_block": "联系方式已拦截 · 消息未送达",
      "toast.mail_stats_deny": "邮件统计仅限 admin/director",
      "toast.mail_sent": "邮件已发送（smtp/mock）",
      "toast.mail_err": "错误：{err}",
      "toast.draft_rej": "草稿已拒绝",
      "toast.cmd_ok": "「回复」命令已执行",
      "toast.cmd_err": "命令错误",
      "toast.esc_ok": "已升级给总监",
      "toast.esc_err": "错误",
      "crm.scope.admin": "完整 · RU+CN · 管理员",
      "crm.scope.director": "完整 · RU+CN · 无管理后台",
      "crm.scope.ru": "仅 RU · 无 CN 金额",
      "crm.scope.cn": "仅 CN · 样品 ¥",
      "crm.filter.all": "全部",
      "crm.empty": "此角色无卡片",
      "crm.contact": "联系人",
      "crm.samples_suffix": "样品",
      "crm.rub_hidden": "RU 金额已隐藏",
      "crm.samples_title": "样品费用",
      "crm.th.item": "项目",
      "crm.th.buy": "采购",
      "crm.th.ship": "运费",
      "crm.th.total": "合计",
      "crm.samples_total": "项目合计：采购 {p} + 运费 {s} = ",
      "crm.samples_none": "暂无样品费用",
      "crm.hide.samples_ru": "样品费用（¥）对 RU 角色隐藏 · CN / 总监 / 管理员可见",
      "crm.hide.ru": "RU 角色：不显示中国价格与 ¥ 金额",
      "crm.hide.cn": "CN 角色：不显示俄罗斯金额（₽ / НМЦК）",
      "crm.hide.dir": "总监：完整 CRM · 用户管理后台不可用",
      "crm.history": "沟通历史",
      "crm.projects": "当前项目",
      "crm.deal_sum": "成交金额",
      "crm.next": "下一步",
      "crm.status.new": "新建",
      "crm.status.work": "进行中",
      "crm.status.closed": "已关闭",
      "crm.c1.history0": "消息：首次联系，索要报价",
      "crm.c1.history1": "电话：确认仓库品类",
      "crm.c1.project": "阿尔法仓库照明订单",
      "crm.c1.next": "发送最终报价 · 今日 15:00",
      "crm.c2.history0": "消息：讨论规格",
      "crm.c2.history1": "电话：确认工期",
      "crm.c2.history2": "文件：报价后规格 → shared RU",
      "crm.c2.project": "弗龙泽小区灯具订单",
      "crm.c2.next": "提醒样品 · 明日 11:00",
      "crm.c2.exp0": "采购 LED 样品",
      "crm.c2.exp1": "发往 CN hub",
      "crm.c2.exp2": "包装 / 出口",
      "crm.c3.history0": "交易关闭 · 已发货",
      "crm.c3.history1": "账单与最终报价已归档",
      "crm.c3.project": "Q1 线型灯具供货",
      "crm.c3.next": "一季度后再激活",
      "crm.c4.history0": "Samples BOM confirmed",
      "crm.c4.history1": "Purchase + shipping logged in ¥",
      "crm.c4.project": "Street lights CN-Phase 2 · samples",
      "crm.c4.next": "关闭项目样品费用",
      "crm.c4.exp0": "采购驱动（样品）",
      "crm.c4.exp1": "样品发往中国",
      "crm.c5.history0": "New RFQ for 6W spot samples",
      "crm.c5.project": "Spot 6W 3000K samples batch",
      "crm.c5.next": "采购样品并计入运费 ¥",
      "crm.c5.exp0": "采购射灯（样品）",
      "tender.t1.title": "4661969 · B2B 照明",
      "tender.t1.meta": "提交截止 5月26日 · 5 项任务",
      "tender.t2.title": "4652879 · 乌拉尔地区",
      "tender.t2.meta": "提交截止 5月22日 · 2 项任务",
      "tender.t3.title": "0373100011226000001",
      "tender.t3.meta": "Shared RU · 有账单与报价",
      "tender.t4.title": "弗龙泽小区（订单）",
      "tender.t4.meta": "非招标 · client_order",
      "tv.found": "已找到",
      "tv.work": "进行中",
      "tv.apps": "申请",
      "tv.won": "已中标",
      "tv.lost": "已落标",
      "storage.doc_types": "文档类型（自动）",
      "storage.empty": "空",
      "folder.spec": "规格",
      "folder.spec_retender": "含再竞标规格",
      "folder.spec_final": "最终规格",
      "folder.kp_final": "最终报价",
      "folder.spec_after_kp": "报价后规格",
      "folder.invoice": "账单",
      "folder.drawings": "图纸",
      "storage.proj.frunze": "弗龙泽住宅小区",
      "storage.proj.alfa": "阿尔法照明有限公司",
      "storage.proj.t466": "招标 4661969",
      "file.spec_v3": "规格_v3.xlsx",
      "file.kp_draft": "报价_草稿.pdf",
      "file.corr": "往来.txt",
      "file.spec": "规格.xlsx",
      "file.kp_final": "最终_报价.pdf",
      "file.spec_ret": "含再竞标_规格.xlsx",
      "file.dwg_a1": "图纸_A1.pdf",
      "mail.no_token": "无令牌或 API。请登录（角色）并点击「同步」。",
      "mail.empty": "暂无邮件",
      "mail.no_subject": "(无主题)",
      "mail.draft": "草稿：",
      "mail.no_access": "无权限或 API",
      "mail.manager_col": "经理",
    },
    ru: {
      "login.enter": "Войти как сотрудник",
      "login.enter_demo": "Демо-вход (без пароля)",
      "login.hint": "Демо-вход как <strong>ru1 · Алексей · RU Manager</strong> · без пароля",
      "login.sub": "Lighting Supply CN ↔ RU · вход по коду из почты",
      "login.email": "Email",
      "login.code": "Код из письма",
      "login.send_code": "Отправить код",
      "login.verify": "Войти",
      "login.resend": "Отправить снова",
      "login.code_sent": "Код отправлен на почту",
      "login.code_sent_mock": "MOCK: код для теста",
      "login.enter_code": "Введите 6-значный код",
      "login.bad_code": "Неверный код",
      "login.wait_resend": "Повтор через {sec} с",
      "login.sending": "Отправка…",
      "login.verifying": "Проверка…",
      "login.remember": "Запомнить меня",
      "nav.personal": "Личная",
      "nav.crm": "CRM",
      "nav.leads": "Заявки",
      "leads.pick": "Выберите заявку слева",
      "leads.empty": "Заявок с сайта пока нет",
      "leads.source": "Источник",
      "leads.source.website": "сайт",
      "leads.kind": "Тип",
      "leads.kind.client_order": "заказ клиента",
      "leads.kind.tender": "тендер",
      "leads.status": "Статус",
      "leads.status.new": "новая",
      "leads.status.in_progress": "в работе",
      "leads.status.closed": "закрыта",
      "leads.filter.all": "Все",
      "leads.message": "Текст",
      "leads.company": "Компания",
      "leads.contact": "Контакт",
      "leads.date": "Дата",
      "leads.project_type": "Тип проекта",
      "leads.set_status": "Статус →",
      "leads.load_err": "Не удалось загрузить заявки (нужен вход)",
      "nav.tenders": "Тендеры",
      "nav.news": "Новости",
      "nav.tv": "TV",
      "nav.storage": "Хранилище",
      "nav.supply": "Gilil Supply",
      "supply.hint": "Stage 2 · JWT · WS · 8797",
      "supply.reload": "Обновить",
      "nav.chats": "Чаты",
      "nav.mail": "Почта",
      "nav.funnel": "Воронка",
      "nav.activity": "Журнал",
      "nav.usefulness": "Полезность",
      "nav.tasks_plans": "Задачи и планы",
      "nav.calendar": "Календарь",
      "cal.add": "+ Добавить событие",
      "cal.today": "Сегодня",
      "cal.day_empty": "Нет событий на этот день",
      "cal.modal_title": "Добавить событие",
      "cal.modal_hint": "Название · дата · время · проект или задача",
      "cal.lbl_title": "Название",
      "cal.lbl_date": "Дата",
      "cal.lbl_time": "Время",
      "cal.lbl_project": "Проект",
      "cal.lbl_task": "Задача",
      "cal.save": "Сохранить",
      "cal.cancel": "Отмена",
      "cal.added": "Событие сохранено",
      "cal.deleted": "Событие удалено",
      "cal.delete": "Удалить",
      "cal.link_project": "Проект",
      "cal.link_task": "Задача",
      "cal.no_link": "Без привязки",
      "cal.weekday.0": "Пн",
      "cal.weekday.1": "Вт",
      "cal.weekday.2": "Ср",
      "cal.weekday.3": "Чт",
      "cal.weekday.4": "Пт",
      "cal.weekday.5": "Сб",
      "cal.weekday.6": "Вс",
      "cal.months": "Январь,Февраль,Март,Апрель,Май,Июнь,Июль,Август,Сентябрь,Октябрь,Ноябрь,Декабрь",
      "tp.add": "+ Добавить задачу",
      "tp.sub": "Анализ задач и планов · имя · статус · срок · ответственный",
      "tp.col_name": "Задача",
      "tp.col_status": "Статус",
      "tp.col_due": "Срок",
      "tp.col_owner": "Ответственный",
      "tp.empty": "Нет задач",
      "tp.status_done": "Готово",
      "tp.status_overdue": "Просрочено",
      "tp.status_progress": "В работе",
      "tp.status_invoice": "Счёт",
      "tp.owner_default": "Алексей",
      "tp.added": "Задача добавлена",
      "tp.new_title": "Новая задача",
      "tp.new_desc": "Добавлено вручную",
      "nav.mail_stats": "Статистика почты",
      "nav.tier.crm": "CRM",
      "nav.tier.media": "Медиа",
      "nav.tier.mail": "Почта",
      "nav.tier.more": "Ещё",
      "nav.tier.team": "Команда",
      "personal.who": "Кто я",
      "personal.lbl_name": "Имя",
      "personal.lbl_role": "Роль",
      "personal.lbl_company": "Компания",
      "personal.lbl_team": "Команда / город",
      "personal.lbl_login": "Логин",
      "personal.tasks_summary": "Сводка задач",
      "personal.today": "сегодня",
      "personal.stat_active": "Активные",
      "personal.stat_wait": "На согласов.",
      "personal.stat_overdue": "Просрочено",
      "personal.stat_done": "Закрыто",
      "personal.demo_note": "Задачи <strong>не</strong> в верхнем меню — бейдж на «Личная» и красная кнопка справа внизу. Сегодняшние без галочки горят красным.",
      "personal.plan_today": "План на сегодня",
      "personal.plan_hint": "галочка → директору-боту",
      "personal.plan_note": "✓ Галочка сразу уходит директору-боту (демо: toast «Отправлено директору-боту»).",
      "personal.tasks_today": "Задачи сегодня",
      "personal.tasks_hot": "горят красным",
      "personal.filter_all": "Все",
      "personal.filter_regular": "Обычные",
      "personal.filter_invoice": "Счёт",
      "personal.demo_beep": "Демо: beep (просрочка >1ч)",
      "personal.open_first": "Открыть первую задачу",
      "personal.new_invoice": "+ Новый счёт",
      "personal.director_rating": "Оценка директора",
      "personal.lbl_score": "Оценка",
      "personal.lbl_director_comment": "Комментарий директора",
      "personal.lbl_score_at": "Дата оценки",
      "personal.lbl_hire_date": "Дата приёма",
      "personal.lbl_time_in_app": "Время в программе",
      "theme.gear_title": "Настройки",
      "theme.title": "Тема оформления",
      "theme.settings": "Настройки",
      "settings.manual": "Инструкция по Gilil On",
      "settings.manual_missing": "Файл инструкции ещё не готов — появится рядом с программой",
      "theme.label": "Тема оформления",
      "theme.hint": "Выбор сохраняется в браузере (localStorage).",

      "pcard.company": "Компания",
      "pcard.tender_no": "№ тендера",
      "pcard.description": "Что / описание",
      "pcard.curator": "Куратор",
      "pcard.docs": "Документы",
      "pcard.manager": "Менеджер",
      "pcard.save": "Сохранить",
      "pcard.plan_status": "Статус выполнения плана",
      "pcard.plan_on_track": "в плане",
      "pcard.plan_behind": "отстаёт",
      "pcard.plan_done": "выполнено",
      "pcard.plan_meta": "{done}/{total} задач · просрочено {overdue}",
      "lang.label": "Язык интерфейса",
      "notif.title": "Уведомления",
      "notif.read_all": "Прочитать все",
      "notif.sound": "Звук уведомлений",
      "update.available": "Обновление доступно",
      "update.available_ver": "Обновление доступно · v{ver}",
      "update.download": "Загрузить",
      "update.downloading": "Загрузка… {pct}%",
      "update.ready": "Обновление загружено",
      "update.install": "Установить и перезапустить",
      "update.error": "Ошибка обновления: {err}",
      "notif.empty": "Пока тихо",
      "notif.empty_sub": "Новые сообщения, задачи и счета появятся здесь",
      "notif.tab.all": "Все",
      "notif.tab.message": "Сообщения",
      "notif.tab.task": "Задачи",
      "notif.tab.invoice": "Счета",
      "notif.type.message": "сообщение",
      "notif.type.task": "задача",
      "notif.type.invoice": "счёт",
      "notif.type.lead": "заявка",
      "notif.type.mail": "почта",
      "theme.dark": "Тёмная",
      "theme.cyan": "Мобильная · Cyan",
      "theme.blue": "Мобильная · Cyan",
      "theme.bitrix": "Битрикс24 · светлая",
      "theme.beige": "Битрикс",
      "toast.theme": "Тема: {name}",
      "crm.admin": "Админка",
      "crm.admin_hint": "Управление пользователями и настройки — только админ (Руслан).",
      "crm.users": "Пользователи",
      "smtp.allowlist_title": "Доступ к почте SMTP",
      "smtp.allowlist_hint": "Только адреса из списка могут получать OTP / использовать общий ящик. App Password не показывается.",
      "smtp.email_ph": "email@example.com",
      "smtp.label_ph": "метка",
      "smtp.add": "Добавить",
      "smtp.remove": "Удалить",
      "smtp.deactivate": "Выкл",
      "smtp.activate": "Вкл",
      "smtp.empty": "Белый список пуст",
      "smtp.saved": "Сохранено",
      "smtp.err": "Ошибка: {err}",
      "smtp.active": "активен",
      "smtp.inactive": "выкл",
      "tenders.bar": "Тендеры · встроенная панель",
      "tenders.open": "открыть отдельно ↗",
      "tenders.crm": "CRM тендеров ↗",
      "news.bar": "Новости",
      "news.open": "открыть news.html ↗",
      "tv.bar": "TV-экран CRM",
      "tv.open": "открыть crm-tv.html ↗",
      "tv.title": "CRM TV",
      "tv.desc": "Витрина воронки тендеров для большого экрана. Ниже — превью; полный экран по ссылке.",
      "storage.mine": "Моё хранилище",
      "storage.mine_hint": "проекты ru1",
      "storage.mine_desc": "Разбивка по проектам: <span class=\"proj-chip order\">client_order</span> заказ клиента · <span class=\"proj-chip tender\">tender</span> тендер",
      "storage.shared": "Общая папка RU",
      "storage.shared_hint": "авто-раскладка",
      "storage.shared_desc": "Типы документов + папки <code style=\"color:var(--teal)\">tenders/&lt;номер&gt;/</code>",
      "chats.select": "Выберите диалог слева",

      "tfc.title": "Задача из чата",
      "tfc.hint": "Создать задачу, не выходя из диалога",
      "tfc.lbl_title": "Заголовок",
      "tfc.lbl_desc": "Описание",
      "tfc.lbl_assignee": "Исполнитель",
      "tfc.notify": "Уведомить исполнителя",
      "tfc.submit": "Создать задачу",
      "tfc.cancel": "Отмена",
      "tfc.btn": "Задача",
      "tfc.sel_tip": "Создать задачу",
      "tfc.ok": "Задача создана",
      "tfc.fail": "Не удалось создать задачу",
      "cmdk.ph": "Поиск: чаты, задачи, счета, проекты…",
      "cmdk.empty": "Ничего не найдено",
      "cmdk.foot": "↑↓ выбрать · Enter открыть · Esc закрыть",
      "cqr.label": "Статус:",
      "cqr.read": "Прочёл",
      "cqr.replied": "Ответил",
      "cqr.in_progress": "В работе",
      "cqr.done": "Готово",
      "cqr.set": "Статус: {status}",
      "cqr.fail": "Не удалось обновить статус",
      "chats.search": "Поиск диалогов (RU / CN / Проекты)…  ⌘K",
      "chats.msg_search": "Поиск по тексту…",
      "chats.from": "с",
      "chats.to": "по",
      "chats.media": "📎 Медиа",
      "chats.photo": "🖼 Фото",
      "chats.clear": "Сброс",
      "chats.input": "Сообщение…",
      "chats.send": "Отправить",
      "chats.policy": "Правила: RU не видит CN-цены · CN не видит RU-цены · контакты только через карточки программы",
      "chats.team_ru": "Команда RU",
      "chats.team_cn": "Команда CN",
      "chats.teams_both": "Обе команды",
      "chats.team_vis": "Видимость команд",
      "chats.projects": "Проекты",
      "chats.director": "Дирекция",
      "chats.no_match": "Нет совпадений",
      "chats.auto_tr": "перевод",
      "chats.no_filter": "Нет сообщений по фильтру · сбросьте поиск / даты / медиа",
      "chats.voice": "Голос",
      "chats.voice_cancel": "Отмена",
      "chats.voice_stop": "Стоп",
      "chats.voice_send": "Отправить голосовое",
      "chats.voice_to_text": "В текст",
      "chats.voice_rec": "Запись…",
      "chats.voice_need_https": "Микрофон нужен HTTPS или localhost",
      "chats.voice_denied": "Нет доступа к микрофону",
      "chats.voice_stt_fail": "Не удалось распознать · повторите или введите вручную",
      "chats.voice_sent": "Голосовое отправлено",
      "chats.dictation": "🎤 Диктовка",
      "chats.dictation_mail": "🎤 В черновик",
      "chats.voice_dur": "{s} с",
      "chats.voice_zh": "中文",
      "chats.voice_transcribing": "расшифровка…",
      "mail.sync": "Синхронизировать",
      "mail.templates": "Шаблоны",
      "mail.in": "Входящие",
      "mail.out": "Исходящие",
      "mail.waiting": "Ждут ответа",
      "mail.day": "День",
      "mail.week": "Неделя",
      "mail.month": "Месяц",
      "mail.by_managers": "По менеджерам",
      "mail.by_projects": "По проектам (узкие места)",
      "mail.dynamics": "Динамика",
      "fab.tasks": "Задачи",
      "fab.tasks_title": "Задачи сегодня",
      "lang.switched": "Язык интерфейса: RU",
      "mail.mode_ph": "режим…",
      "price.cn_redact": "[цена CN скрыта]",
      "price.ru_redact": "[цена RU скрыта]",
      "price.cn_hidden": "Цена CN скрыта для вашей роли",
      "price.ru_hidden": "Цена RU скрыта для вашей роли",
      "price.cn_lbl": "Цена CN",
      "price.ru_lbl": "Цена RU",
      "leak.msg": "Сообщение не доставлено: запрещён обмен контактами вне программы ({reason}{matched}). Используйте карточки CRM / поставщиков.",
      "media.photo": "Фото",
      "media.file": "Файл",
      "leak.phone": "телефон",
      "leak.email": "email",
      "leak.wechat": "WeChat",
      "leak.telegram": "Telegram",
      "leak.bypass": "обход контактов",
      "leak.empty": "пустое сообщение",
      "leak.blocked": "Сообщение не доставлено: запрещён обмен контактами вне программы (",
      "person.ruslan.full": "Руслан Гилиль",
      "person.ruslan.short": "Руслан",
      "person.igor.full": "Игорь Директоров",
      "person.igor.short": "Игорь",
      "person.alexey.full": "Алексей Петров",
      "person.alexey.short": "Алексей",
      "person.lina.full": "Ли На",
      "person.lina.short": "Ли На",
      "person.maria_k": "Мария К.",
      "person.dmitry_s": "Дмитрий С.",
      "person.anna_p": "Анна П.",
      "person.alexey_r": "Алексей Р.",
      "person.wang_li": "Ван Ли",
      "person.zhang_wei": "Чжан Вэй",
      "person.ivanov": "Иван Иванов",
      "person.smirnova": "Анна Смирнова",
      "person.volkov": "Пётр Волков",
      "role.admin": "Админ · владелец",
      "role.director": "Директор",
      "role.ru_manager": "RU Manager",
      "role.cn_manager": "CN Manager",
      "role.chat.ru_mgr_msk": "RU Manager · Москва MSK",
      "role.chat.sales_yekt": "Sales Manager · Екатеринбург YEKT",
      "role.chat.pm_novt": "Project Manager · Новосибирск NOVT",
      "role.chat.support_msk": "Support Lead · Москва MSK",
      "role.chat.cn_sales": "CN Sales Director · Shanghai CST",
      "role.chat.factory": "Factory Manager · Zhongshan CST",
      "role.chat.supply": "Supply Planner · Shanghai CST",
      "role.chat.dir_msk": "Директор · Москва MSK",
      "role.chat.owner_msk": "Владелец · Москва MSK",
      "role.chat.igor_dir": "Игорь · Директор",
      "role.chat.ruslan_admin": "Руслан · Админ",
      "team.russia_msk": "Россия · Москва (MSK)",
      "team.china_sh": "Китай · Shanghai (CST)",
      "login.admin": "admin (админ)",
      "login.demo_dir": "dir1 (демо)",
      "login.demo_ru": "ru1 (демо)",
      "login.demo_cn": "cn1 (демо)",
      "company.alfa": "ООО Альфа Лайт",
      "company.frunze": "ЖК Фрунзенский",
      "company.seversvet": "ООО Северсвет",
      "company.zs_factory": "Zhongshan LED Factory · Phase 2",
      "company.sh_supply": "Shanghai Supply · Spot modules",
      "project.frunze_lights": "Заказ светильников",
      "project.retail": "Retail lighting",
      "project.street": "Street lights",
      "project.b2b": "B2B platform",
      "project.iot": "IoT solution",
      "project.tender_b2b": "B2B lighting",
      "chat.pr.frunze": "ЖК Фрунзенский",
      "chat.pr.t466": "Тендер 4661969",
      "chat.pr.2025ru": "2025-RU",
      "chat.pr.cn2": "Project CN-Phase 2",
      "chat.pr.led": "LED Platform",
      "chat.pr.iot": "Control Hub",
      "plan.p1.title": "Утренний обзор тендеров",
      "plan.p1.meta": "до 10:00",
      "plan.p2.title": "КП Альфа Лайт → клиенту",
      "plan.p2.meta": "задача t1 · до 15:00",
      "plan.p3.title": "Связаться с CN по образцам Фрунзенский",
      "plan.p3.meta": "Ван Ли / Ли На",
      "plan.p4.title": "Разложить документы в shared RU",
      "plan.p4.meta": "спецификация / КП / счёт",
      "task.t1.title": "Отправить КП по ООО Альфа Лайт",
      "task.t1.desc": "Финальное КП в shared RU → kp/. Отметить в плане.",
      "task.t2.title": "Напомнить про образцы · ЖК Фрунзенский",
      "task.t2.desc": "Согласовано на завтра 11:00. Подготовить трек CN.",
      "task.t3.title": "Загрузить спецификацию с переторжкой · тендер 4661969",
      "task.t3.desc": "Файл в shared/ru/tenders/4661969/…",
      "task.t4.title": "Согласовать сроки с CN по Control Hub",
      "task.t4.desc": "Закрыто утром.",
      "inv.inv1.title": "Счёт · ООО Альфа Лайт",
      "inv.inv1.desc": "Оплата по финальному КП · освещение склада",
      "inv.inv2.title": "Счёт · ЖК Фрунзенский",
      "inv.inv2.desc": "Аванс 30% · заказ светильников",
      "invoice.title_prefix": "Счёт",
      "inv.step.manager": "Менеджер",
      "inv.step.director": "Директор",
      "inv.step.ruslan": "Руслан",
      "status.invoice_pending_manager": "Ожидает менеджера",
      "status.invoice_pending_director": "Ожидает директора",
      "status.invoice_pending_ruslan": "Ожидает Руслана",
      "status.invoice_approved": "Одобрен",
      "status.invoice_rejected": "Отклонён",
      "status.invoice_fallback": "Счёт",
      "task.badge.done": "закрыта",
      "task.badge.overdue": "сегодня · >1ч",
      "task.badge.progress": "в работе",
      "task.empty_filter": "Нет задач в этом фильтре",
      "task.created_by": "создал",
      "task.taken": "взял",
      "task.closed": "закрыл",
      "tm.close_aria": "Закрыть",
      "tm.default_title": "Задача",
      "tm.lbl_company": "Компания",
      "tm.lbl_amount": "Сумма",
      "tm.lbl_invno": "№ счёта",
      "tm.lbl_creator": "Создал",
      "tm.lbl_taken": "Взял в работу",
      "tm.lbl_closed": "Закрыл галочкой",
      "tm.regular_hint": "Галочка уходит директору-боту. Если нет галочки >1 часа — звуковой сигнал.",
      "tm.check_on": "Поставить галочку",
      "tm.check_off": "Снять галочку",
      "tm.beep": "Сигнал (demo)",
      "tm.close": "Закрыть",
      "tm.approve": "Согласовать",
      "tm.reject": "Отклонить",
      "tm.status_all_ok": "Одобрен всеми · оплата разрешена",
      "tm.status_stopped": "Отклонён · цепочка остановлена",
      "tm.need_ru": "RU (менеджер)",
      "tm.need_dir": "директора",
      "tm.need_admin": "админа (Руслан)",
      "tm.switch_role": " · переключите роль на {need} (кнопки сверху справа)",
      "invcreate.title": "Новый счёт",
      "invcreate.chain": "Цепочка: менеджер → директор → Руслан",
      "invcreate.company": "Компания-получатель",
      "invcreate.amount": "Сумма (₽)",
      "invcreate.desc": "№ / описание счёта",
      "invcreate.submit": "Создать счёт",
      "invcreate.cancel": "Отмена",
      "invcreate.ph_company": "ООО …",
      "invcreate.ph_desc": "INV-2026-050 · оплата по КП",
      "inv.alert": "Подтвердите согласование счёта на оплату <strong>{company}</strong>, сумма <strong>{amount}</strong>",
      "inv.alert_open": "Открыть",
      "inv.beep": "🔔 Подтвердите согласование счёта на оплату {company}, сумма {amount}",
      "beep.overdue": "🔔 Сигнал: задача без галочки больше 1 часа",
      "toast.lang": "",
      "toast.role": "Демо-роль: {short} · {role}",
      "toast.entered": "Вошли как {login} · {short} · {role}",
      "toast.plan_on": "✓ План: «{title}» → отправлено директору-боту",
      "toast.plan_off": "Галочка снята · директору-боту уведомление об откате",
      "toast.task_on": "✓ Задача закрыта → отправлено директору-боту",
      "toast.task_off": "Задача снова открыта · директору-боту уведомление",
      "toast.no_right": "Нет права на этом шаге · смените демо-роль",
      "toast.mgr_ok": "✓ Менеджер согласовал → директору",
      "toast.dir_ok": "✓ Директор согласовал → Руслану",
      "toast.ruslan_ok": "✓ Счёт одобрен Русланом · статус «Одобрен»",
      "toast.inv_rej": "✕ Счёт отклонён · цепочка остановлена",
      "toast.inv_created": "Счёт создан · ожидает менеджера",
      "toast.inv_need": "Укажите компанию и сумму",
      "toast.admin_only": "Админка только для роли Админ",
      "toast.admin_users": "Админка · пользователи (демо): admin / dir1 / ru1 / cn1",
      "toast.tpl_deny": "Шаблоны редактирует admin/director",
      "toast.tpl_count": "Шаблонов: {n} (редактирование через API / admin)",
      "toast.chat_filters": "Фильтры чата сброшены",
      "toast.contact_block": "Контакт заблокирован · сообщение не доставлено",
      "toast.mail_stats_deny": "Статистика почты только для admin/director",
      "toast.mail_sent": "Письмо отправлено (smtp/mock)",
      "toast.mail_err": "Ошибка: {err}",
      "toast.draft_rej": "Черновик отклонён",
      "toast.cmd_ok": "Команда «ответь» выполнена",
      "toast.cmd_err": "Ошибка команды",
      "toast.esc_ok": "Эскалация директору",
      "toast.esc_err": "Ошибка",
      "crm.scope.admin": "полная · RU+CN · админ",
      "crm.scope.director": "полная · RU+CN · без админки",
      "crm.scope.ru": "только RU · без CN сумм",
      "crm.scope.cn": "только CN · образцы ¥",
      "crm.filter.all": "Все",
      "crm.empty": "Нет карточек для этой роли",
      "crm.contact": "Контакт",
      "crm.samples_suffix": "образцы",
      "crm.rub_hidden": "Сумма RU скрыта",
      "crm.samples_title": "Расходы на образцы",
      "crm.th.item": "Статья",
      "crm.th.buy": "Покупка",
      "crm.th.ship": "Отправка",
      "crm.th.total": "Итого",
      "crm.samples_total": "Итого по проекту: покупка {p} + отправка {s} = ",
      "crm.samples_none": "Пока нет расходов на образцы",
      "crm.hide.samples_ru": "Расходы на образцы (¥) скрыты для роли RU · видны CN / директору / админу",
      "crm.hide.ru": "Роль RU: китайские цены и суммы ¥ не отображаются",
      "crm.hide.cn": "Роль CN: российские суммы (₽ / НМЦК) не отображаются",
      "crm.hide.dir": "Директор: полная CRM · админка пользователей недоступна",
      "crm.history": "История общения",
      "crm.projects": "Текущие проекты",
      "crm.deal_sum": "Сумма сделки",
      "crm.next": "Следующий шаг",
      "crm.status.new": "Новый",
      "crm.status.work": "В работе",
      "crm.status.closed": "Закрыт",
      "crm.c1.history0": "Сообщение: Первый контакт, запрос КП",
      "crm.c1.history1": "Звонок: Уточнили номенклатуру склада",
      "crm.c1.project": "Заказ освещения склада Альфа",
      "crm.c1.next": "Отправить финальное КП · сегодня 15:00",
      "crm.c2.history0": "Сообщение: Обсудили спецификацию",
      "crm.c2.history1": "Звонок: Согласование сроков",
      "crm.c2.history2": "Файл: спецификация после КП → shared RU",
      "crm.c2.project": "Заказ светильников для ЖК Фрунзенский",
      "crm.c2.next": "Напомнить про образцы · завтра 11:00",
      "crm.c2.exp0": "Покупка образцов LED",
      "crm.c2.exp1": "Отправка в CN hub",
      "crm.c2.exp2": "Упаковка / экспорт",
      "crm.c3.history0": "Сделка закрыта · отгрузка выполнена",
      "crm.c3.history1": "Счёт и финальное КП в архиве",
      "crm.c3.project": "Поставка линейных светильников Q1",
      "crm.c3.next": "Реактивация через квартал",
      "crm.c4.history0": "Samples BOM confirmed",
      "crm.c4.history1": "Purchase + shipping logged in ¥",
      "crm.c4.project": "Street lights CN-Phase 2 · samples",
      "crm.c4.next": "Закрыть расходы на образцы по проекту",
      "crm.c4.exp0": "Покупка драйверов (образцы)",
      "crm.c4.exp1": "Отправка образцов в Китай",
      "crm.c5.history0": "New RFQ for 6W spot samples",
      "crm.c5.project": "Spot 6W 3000K samples batch",
      "crm.c5.next": "Закупить образцы + учесть shipping ¥",
      "crm.c5.exp0": "Покупка спотов (образцы)",
      "tender.t1.title": "4661969 · B2B освещение",
      "tender.t1.meta": "Подача до 26 мая · 5 задач",
      "tender.t2.title": "4652879 · Урал регион",
      "tender.t2.meta": "Подача до 22 мая · 2 задачи",
      "tender.t3.title": "0373100011226000001",
      "tender.t3.meta": "Shared RU · есть счёт и КП",
      "tender.t4.title": "ЖК Фрунзенский (заказ)",
      "tender.t4.meta": "Не тендер · client_order",
      "tv.found": "Найдены",
      "tv.work": "В работе",
      "tv.apps": "Заявки",
      "tv.won": "Выиграны",
      "tv.lost": "Проиграны",
      "storage.doc_types": "Типы документов (авто)",
      "storage.empty": "пусто",
      "folder.spec": "спецификация",
      "folder.spec_retender": "спецификация с переторжкой",
      "folder.spec_final": "финальная спецификация",
      "folder.kp_final": "финальное КП",
      "folder.spec_after_kp": "спецификация после КП",
      "folder.invoice": "счёт",
      "folder.drawings": "чертежи",
      "storage.proj.frunze": "ЖК Фрунзенский",
      "storage.proj.alfa": "ООО Альфа Лайт",
      "storage.proj.t466": "Тендер 4661969",
      "file.spec_v3": "спецификация_v3.xlsx",
      "file.kp_draft": "КП_черновик.pdf",
      "file.corr": "переписка.txt",
      "file.spec": "спецификация.xlsx",
      "file.kp_final": "финальное_КП.pdf",
      "file.spec_ret": "спецификация_с_переторжкой.xlsx",
      "file.dwg_a1": "чертежи_A1.pdf",
      "mail.no_token": "Нет токена или API. Войдите (роль) и нажмите «Синхронизировать».",
      "mail.empty": "Писем нет",
      "mail.no_subject": "(без темы)",
      "mail.draft": "черновик: ",
      "mail.no_access": "Нет доступа или API",
      "mail.manager_col": "Менеджер",
    },
    en: {
      "login.enter": "Sign in as employee",
      "login.enter_demo": "Demo enter (no password)",
      "login.hint": "Demo login as <strong>ru1 · Alexey · RU Manager</strong> · no password",
      "login.sub": "Lighting Supply CN ↔ RU · email OTP login",
      "login.email": "Email",
      "login.code": "Code from email",
      "login.send_code": "Send code",
      "login.verify": "Sign in",
      "login.resend": "Resend",
      "login.code_sent": "Code sent to your email",
      "login.code_sent_mock": "MOCK: test code",
      "login.enter_code": "Enter the 6-digit code",
      "login.bad_code": "Invalid code",
      "login.wait_resend": "Resend in {sec}s",
      "login.sending": "Sending…",
      "login.verifying": "Verifying…",
      "login.remember": "Remember me",
      "nav.personal": "Personal",
      "nav.crm": "CRM",
      "nav.leads": "Leads",
      "leads.pick": "Select a lead on the left",
      "leads.empty": "No website leads yet",
      "leads.source": "Source",
      "leads.source.website": "website",
      "leads.kind": "Kind",
      "leads.kind.client_order": "client order",
      "leads.kind.tender": "tender",
      "leads.status": "Status",
      "leads.status.new": "new",
      "leads.status.in_progress": "in progress",
      "leads.status.closed": "closed",
      "leads.filter.all": "All",
      "leads.message": "Message",
      "leads.company": "Company",
      "leads.contact": "Contact",
      "leads.date": "Date",
      "leads.project_type": "Project type",
      "leads.set_status": "Status →",
      "leads.load_err": "Could not load leads (sign-in required)",
      "nav.tenders": "Tenders",
      "nav.news": "News",
      "nav.tv": "TV",
      "nav.storage": "Storage",
      "nav.supply": "Gilil Supply",
      "supply.hint": "Stage 2 · JWT · WS · 8797",
      "supply.reload": "Reload",
      "nav.chats": "Chats",
      "nav.mail": "Mail",
      "nav.funnel": "Funnel",
      "nav.activity": "Activity",
      "nav.usefulness": "Usefulness",
      "nav.tasks_plans": "Tasks & plans",
      "nav.calendar": "Calendar",
      "cal.add": "+ Add event",
      "cal.today": "Today",
      "cal.day_empty": "No events for this day",
      "cal.modal_title": "Add event",
      "cal.modal_hint": "Title · date · time · project or task",
      "cal.lbl_title": "Title",
      "cal.lbl_date": "Date",
      "cal.lbl_time": "Time",
      "cal.lbl_project": "Project",
      "cal.lbl_task": "Task",
      "cal.save": "Save",
      "cal.cancel": "Cancel",
      "cal.added": "Event saved",
      "cal.deleted": "Event deleted",
      "cal.delete": "Delete",
      "cal.link_project": "Project",
      "cal.link_task": "Task",
      "cal.no_link": "No link",
      "cal.weekday.0": "Mon",
      "cal.weekday.1": "Tue",
      "cal.weekday.2": "Wed",
      "cal.weekday.3": "Thu",
      "cal.weekday.4": "Fri",
      "cal.weekday.5": "Sat",
      "cal.weekday.6": "Sun",
      "cal.months": "January,February,March,April,May,June,July,August,September,October,November,December",
      "tp.add": "+ Add task",
      "tp.sub": "Task & plan analysis · name · status · due · owner",
      "tp.col_name": "Task",
      "tp.col_status": "Status",
      "tp.col_due": "Due",
      "tp.col_owner": "Owner",
      "tp.empty": "No tasks",
      "tp.status_done": "Done",
      "tp.status_overdue": "Overdue",
      "tp.status_progress": "In progress",
      "tp.status_invoice": "Invoice",
      "tp.owner_default": "Alexey",
      "tp.added": "Task added",
      "tp.new_title": "New task",
      "tp.new_desc": "Added manually",
      "nav.mail_stats": "Mail stats",
      "nav.tier.crm": "CRM",
      "nav.tier.media": "Media",
      "nav.tier.mail": "Mail",
      "nav.tier.more": "More",
      "nav.tier.team": "Team",
      "personal.who": "Who I am",
      "personal.lbl_name": "Name",
      "personal.lbl_role": "Role",
      "personal.lbl_company": "Company",
      "personal.lbl_team": "Team / city",
      "personal.lbl_login": "Login",
      "personal.tasks_summary": "Task summary",
      "personal.today": "today",
      "personal.stat_active": "Active",
      "personal.stat_wait": "Pending",
      "personal.stat_overdue": "Overdue",
      "personal.stat_done": "Done",
      "personal.demo_note": "Tasks are <strong>not</strong> in the top menu — badge on Personal and the red button bottom-right. Today’s unchecked items glow red.",
      "personal.plan_today": "Plan for today",
      "personal.plan_hint": "check → director bot",
      "personal.plan_note": "✓ A check goes straight to the director bot (demo toast: “Sent to director bot”).",
      "personal.tasks_today": "Tasks today",
      "personal.tasks_hot": "glow red",
      "personal.filter_all": "All",
      "personal.filter_regular": "Regular",
      "personal.filter_invoice": "Invoice",
      "personal.demo_beep": "Demo: beep (overdue >1h)",
      "personal.open_first": "Open first task",
      "personal.new_invoice": "+ New invoice",
      "personal.director_rating": "Director rating",
      "personal.lbl_score": "Score",
      "personal.lbl_director_comment": "Director comment",
      "personal.lbl_score_at": "Rated at",
      "personal.lbl_hire_date": "Hire date",
      "personal.lbl_time_in_app": "Time in app",
      "theme.gear_title": "Settings",
      "theme.title": "UI theme",
      "theme.settings": "Settings",
      "settings.manual": "Gilil On user guide",
      "settings.manual_missing": "User guide file is not ready yet — it will appear next to the app",
      "theme.label": "UI theme",
      "theme.hint": "Choice is saved in the browser (localStorage).",

      "pcard.company": "Company",
      "pcard.tender_no": "Tender no.",
      "pcard.description": "Description",
      "pcard.curator": "Curator",
      "pcard.docs": "Documents",
      "pcard.manager": "Manager",
      "pcard.save": "Save",
      "pcard.plan_status": "Plan completion status",
      "pcard.plan_on_track": "on track",
      "pcard.plan_behind": "behind",
      "pcard.plan_done": "done",
      "pcard.plan_meta": "{done}/{total} tasks · overdue {overdue}",
      "lang.label": "UI language",
      "notif.title": "Notifications",
      "notif.read_all": "Mark all read",
      "notif.sound": "Notification sound",
      "update.available": "Update available",
      "update.available_ver": "Update available · v{ver}",
      "update.download": "Download",
      "update.downloading": "Downloading… {pct}%",
      "update.ready": "Update downloaded",
      "update.install": "Install and restart",
      "update.error": "Update error: {err}",
      "notif.empty": "All quiet",
      "notif.empty_sub": "New messages, tasks and invoices will show up here",
      "notif.tab.all": "All",
      "notif.tab.message": "Messages",
      "notif.tab.task": "Tasks",
      "notif.tab.invoice": "Invoices",
      "notif.type.message": "message",
      "notif.type.task": "task",
      "notif.type.invoice": "invoice",
      "notif.type.lead": "lead",
      "notif.type.mail": "mail",
      "theme.dark": "Dark",
      "theme.cyan": "Mobile · Cyan",
      "theme.blue": "Mobile · Cyan",
      "theme.bitrix": "Bitrix24 light",
      "theme.beige": "Bitrix",
      "toast.theme": "Theme: {name}",
      "crm.admin": "Admin",
      "crm.admin_hint": "User management and settings — admin only (Ruslan).",
      "crm.users": "Users",
      "tenders.bar": "Tenders · embedded panel",
      "tenders.open": "open separately ↗",
      "tenders.crm": "Tenders CRM ↗",
      "news.bar": "News",
      "news.open": "open news.html ↗",
      "tv.bar": "CRM TV screen",
      "tv.open": "open crm-tv.html ↗",
      "tv.title": "CRM TV",
      "tv.desc": "Tender funnel display for a big screen. Preview below; full screen via the link.",
      "storage.mine": "My storage",
      "storage.mine_hint": "ru1 projects",
      "storage.mine_desc": "By project: <span class=\"proj-chip order\">client_order</span> client order · <span class=\"proj-chip tender\">tender</span> tender",
      "storage.shared": "Shared RU folder",
      "storage.shared_hint": "auto-layout",
      "storage.shared_desc": "Document types + folders <code style=\"color:var(--teal)\">tenders/&lt;number&gt;/</code>",
      "chats.select": "Select a chat on the left",

      "tfc.title": "Task from chat",
      "tfc.hint": "Create a task without leaving the dialog",
      "tfc.lbl_title": "Title",
      "tfc.lbl_desc": "Description",
      "tfc.lbl_assignee": "Assignee",
      "tfc.notify": "Notify assignee",
      "tfc.submit": "Create task",
      "tfc.cancel": "Cancel",
      "tfc.btn": "Task",
      "tfc.sel_tip": "Create task",
      "tfc.ok": "Task created",
      "tfc.fail": "Could not create task",
      "cmdk.ph": "Search chats, tasks, invoices, projects…",
      "cmdk.empty": "No results",
      "cmdk.foot": "↑↓ select · Enter open · Esc close",
      "cqr.label": "Status:",
      "cqr.read": "Read",
      "cqr.replied": "Replied",
      "cqr.in_progress": "In progress",
      "cqr.done": "Done",
      "cqr.set": "Status: {status}",
      "cqr.fail": "Could not update status",
      "chats.search": "Search chats (RU / CN / Projects)…  ⌘K",
      "chats.msg_search": "Search by text…",
      "chats.from": "from",
      "chats.to": "to",
      "chats.media": "📎 Media",
      "chats.photo": "🖼 Photos",
      "chats.clear": "Reset",
      "chats.input": "Message…",
      "chats.send": "Send",
      "chats.policy": "Rules: RU cannot see CN prices · CN cannot see RU prices · contacts only via app cards",
      "chats.team_ru": "Team RU",
      "chats.team_cn": "Team CN",
      "chats.teams_both": "Both teams",
      "chats.team_vis": "Team visibility",
      "chats.projects": "Projects",
      "chats.director": "Leadership",
      "chats.no_match": "No matches",
      "chats.auto_tr": "tr",
      "chats.no_filter": "No messages match filters · reset search / dates / media",
      "chats.voice": "Voice",
      "chats.voice_cancel": "Cancel",
      "chats.voice_stop": "Stop",
      "chats.voice_send": "Send voice",
      "chats.voice_to_text": "To text",
      "chats.voice_rec": "Recording…",
      "chats.voice_need_https": "Mic needs HTTPS or localhost",
      "chats.voice_denied": "Microphone permission denied",
      "chats.voice_stt_fail": "Could not transcribe · retry or type",
      "chats.voice_sent": "Voice message sent",
      "chats.dictation": "🎤 Dictate",
      "chats.dictation_mail": "🎤 Dictate into draft",
      "chats.voice_dur": "{s}s",
      "chats.voice_zh": "中文",
      "chats.voice_transcribing": "transcribing…",
      "mail.sync": "Sync",
      "mail.templates": "Templates",
      "mail.in": "Inbox",
      "mail.out": "Sent",
      "mail.waiting": "Awaiting reply",
      "mail.day": "Day",
      "mail.week": "Week",
      "mail.month": "Month",
      "mail.by_managers": "By managers",
      "mail.by_projects": "By projects (bottlenecks)",
      "mail.dynamics": "Dynamics",
      "fab.tasks": "Tasks",
      "fab.tasks_title": "Tasks today",
      "lang.switched": "UI language: EN",
      "mail.mode_ph": "mode…",
      "price.cn_redact": "[CN price hidden]",
      "price.ru_redact": "[RU price hidden]",
      "price.cn_hidden": "CN price hidden for your role",
      "price.ru_hidden": "RU price hidden for your role",
      "price.cn_lbl": "CN price",
      "price.ru_lbl": "RU price",
      "leak.msg": "Message not delivered: contact exchange outside the app is blocked ({reason}{matched}). Use CRM / supplier cards.",
      "media.photo": "Photo",
      "media.file": "File",
      "leak.phone": "phone",
      "leak.email": "email",
      "leak.wechat": "WeChat",
      "leak.telegram": "Telegram",
      "leak.bypass": "contact bypass",
      "leak.empty": "empty message",
      "leak.blocked": "Message not delivered: contact exchange outside the app is blocked (",
      "person.ruslan.full": "Ruslan Gilil",
      "person.ruslan.short": "Ruslan",
      "person.igor.full": "Igor Direktrov",
      "person.igor.short": "Igor",
      "person.alexey.full": "Alexey Petrov",
      "person.alexey.short": "Alexey",
      "person.lina.full": "Li Na",
      "person.lina.short": "Li Na",
      "person.maria_k": "Maria K.",
      "person.dmitry_s": "Dmitry S.",
      "person.anna_p": "Anna P.",
      "person.alexey_r": "Alexey R.",
      "person.wang_li": "Wang Li",
      "person.zhang_wei": "Zhang Wei",
      "person.ivanov": "Ivan Ivanov",
      "person.smirnova": "Anna Smirnova",
      "person.volkov": "Pyotr Volkov",
      "role.admin": "Admin · owner",
      "role.director": "Director",
      "role.ru_manager": "RU Manager",
      "role.cn_manager": "CN Manager",
      "role.chat.ru_mgr_msk": "RU Manager · Moscow MSK",
      "role.chat.sales_yekt": "Sales Manager · Yekaterinburg YEKT",
      "role.chat.pm_novt": "Project Manager · Novosibirsk NOVT",
      "role.chat.support_msk": "Support Lead · Moscow MSK",
      "role.chat.cn_sales": "CN Sales Director · Shanghai CST",
      "role.chat.factory": "Factory Manager · Zhongshan CST",
      "role.chat.supply": "Supply Planner · Shanghai CST",
      "role.chat.dir_msk": "Director · Moscow MSK",
      "role.chat.owner_msk": "Owner · Moscow MSK",
      "role.chat.igor_dir": "Igor · Director",
      "role.chat.ruslan_admin": "Ruslan · Admin",
      "team.russia_msk": "Russia · Moscow (MSK)",
      "team.china_sh": "China · Shanghai (CST)",
      "login.admin": "admin (admin)",
      "login.demo_dir": "dir1 (demo)",
      "login.demo_ru": "ru1 (demo)",
      "login.demo_cn": "cn1 (demo)",
      "company.alfa": "Alfa Light LLC",
      "company.frunze": "Frunzensky Residential",
      "company.seversvet": "Seversvet LLC",
      "company.zs_factory": "Zhongshan LED Factory · Phase 2",
      "company.sh_supply": "Shanghai Supply · Spot modules",
      "project.frunze_lights": "Lighting order",
      "project.retail": "Retail lighting",
      "project.street": "Street lights",
      "project.b2b": "B2B platform",
      "project.iot": "IoT solution",
      "project.tender_b2b": "B2B lighting",
      "chat.pr.frunze": "Frunzensky Residential",
      "chat.pr.t466": "Tender 4661969",
      "chat.pr.2025ru": "2025-RU",
      "chat.pr.cn2": "Project CN-Phase 2",
      "chat.pr.led": "LED Platform",
      "chat.pr.iot": "Control Hub",
      "plan.p1.title": "Morning tender review",
      "plan.p1.meta": "by 10:00",
      "plan.p2.title": "Alfa Light quote → client",
      "plan.p2.meta": "task t1 · by 15:00",
      "plan.p3.title": "Contact CN about Frunzensky samples",
      "plan.p3.meta": "Wang Li / Li Na",
      "plan.p4.title": "Sort documents into shared RU",
      "plan.p4.meta": "spec / quote / invoice",
      "task.t1.title": "Send Alfa Light LLC quote",
      "task.t1.desc": "Final quote in shared RU → kp/. Mark in plan.",
      "task.t2.title": "Remind about samples · Frunzensky",
      "task.t2.desc": "Agreed for tomorrow 11:00. Prepare CN tracking.",
      "task.t3.title": "Upload retender spec · tender 4661969",
      "task.t3.desc": "File in shared/ru/tenders/4661969/…",
      "task.t4.title": "Align Control Hub timeline with CN",
      "task.t4.desc": "Closed in the morning.",
      "inv.inv1.title": "Invoice · Alfa Light LLC",
      "inv.inv1.desc": "Payment per final quote · warehouse lighting",
      "inv.inv2.title": "Invoice · Frunzensky Residential",
      "inv.inv2.desc": "30% advance · lighting order",
      "invoice.title_prefix": "Invoice",
      "inv.step.manager": "Manager",
      "inv.step.director": "Director",
      "inv.step.ruslan": "Ruslan",
      "status.invoice_pending_manager": "Awaiting manager",
      "status.invoice_pending_director": "Awaiting director",
      "status.invoice_pending_ruslan": "Awaiting Ruslan",
      "status.invoice_approved": "Approved",
      "status.invoice_rejected": "Rejected",
      "status.invoice_fallback": "Invoice",
      "task.badge.done": "done",
      "task.badge.overdue": "today · >1h",
      "task.badge.progress": "in progress",
      "task.empty_filter": "No tasks in this filter",
      "task.created_by": "created by",
      "task.taken": "taken",
      "task.closed": "closed",
      "tm.close_aria": "Close",
      "tm.default_title": "Task",
      "tm.lbl_company": "Company",
      "tm.lbl_amount": "Amount",
      "tm.lbl_invno": "Invoice #",
      "tm.lbl_creator": "Created by",
      "tm.lbl_taken": "Taken into work",
      "tm.lbl_closed": "Closed with check",
      "tm.regular_hint": "A check goes to the director bot. No check for >1 hour — sound alert.",
      "tm.check_on": "Mark done",
      "tm.check_off": "Uncheck",
      "tm.beep": "Beep (demo)",
      "tm.close": "Close",
      "tm.approve": "Approve",
      "tm.reject": "Reject",
      "tm.status_all_ok": "Approved by all · payment allowed",
      "tm.status_stopped": "Rejected · chain stopped",
      "tm.need_ru": "RU (manager)",
      "tm.need_dir": "director",
      "tm.need_admin": "admin (Ruslan)",
      "tm.switch_role": " · switch role to {need} (buttons top-right)",
      "invcreate.title": "New invoice",
      "invcreate.chain": "Chain: manager → director → Ruslan",
      "invcreate.company": "Payee company",
      "invcreate.amount": "Amount (₽)",
      "invcreate.desc": "# / invoice description",
      "invcreate.submit": "Create invoice",
      "invcreate.cancel": "Cancel",
      "invcreate.ph_company": "LLC …",
      "invcreate.ph_desc": "INV-2026-050 · payment per quote",
      "inv.alert": "Confirm invoice approval for <strong>{company}</strong>, amount <strong>{amount}</strong>",
      "inv.alert_open": "Open",
      "inv.beep": "🔔 Confirm invoice approval for {company}, amount {amount}",
      "beep.overdue": "🔔 Alert: task unchecked for over 1 hour",
      "toast.lang": "",
      "toast.role": "Demo role: {short} · {role}",
      "toast.entered": "Signed in as {login} · {short} · {role}",
      "toast.plan_on": "✓ Plan: “{title}” → sent to director bot",
      "toast.plan_off": "Unchecked · director bot notified of rollback",
      "toast.task_on": "✓ Task closed → sent to director bot",
      "toast.task_off": "Task reopened · director bot notified",
      "toast.no_right": "No permission at this step · switch demo role",
      "toast.mgr_ok": "✓ Manager approved → director",
      "toast.dir_ok": "✓ Director approved → Ruslan",
      "toast.ruslan_ok": "✓ Invoice approved by Ruslan · status “Approved”",
      "toast.inv_rej": "✕ Invoice rejected · chain stopped",
      "toast.inv_created": "Invoice created · awaiting manager",
      "toast.inv_need": "Enter company and amount",
      "toast.admin_only": "Admin panel for Admin role only",
      "toast.admin_users": "Admin · users (demo): admin / dir1 / ru1 / cn1",
      "toast.tpl_deny": "Templates edited by admin/director",
      "toast.tpl_count": "Templates: {n} (edit via API / admin)",
      "toast.chat_filters": "Chat filters reset",
      "toast.contact_block": "Contact blocked · message not delivered",
      "toast.mail_stats_deny": "Mail stats for admin/director only",
      "toast.mail_sent": "Email sent (smtp/mock)",
      "toast.mail_err": "Error: {err}",
      "toast.draft_rej": "Draft rejected",
      "toast.cmd_ok": "“Reply” command done",
      "toast.cmd_err": "Command error",
      "toast.esc_ok": "Escalated to director",
      "toast.esc_err": "Error",
      "crm.scope.admin": "full · RU+CN · admin",
      "crm.scope.director": "full · RU+CN · no admin",
      "crm.scope.ru": "RU only · no CN amounts",
      "crm.scope.cn": "CN only · samples ¥",
      "crm.filter.all": "All",
      "crm.empty": "No cards for this role",
      "crm.contact": "Contact",
      "crm.samples_suffix": "samples",
      "crm.rub_hidden": "RU amount hidden",
      "crm.samples_title": "Sample expenses",
      "crm.th.item": "Item",
      "crm.th.buy": "Purchase",
      "crm.th.ship": "Shipping",
      "crm.th.total": "Total",
      "crm.samples_total": "Project total: purchase {p} + shipping {s} = ",
      "crm.samples_none": "No sample expenses yet",
      "crm.hide.samples_ru": "Sample expenses (¥) hidden for RU · visible to CN / director / admin",
      "crm.hide.ru": "RU role: Chinese prices and ¥ amounts are hidden",
      "crm.hide.cn": "CN role: Russian amounts (₽ / NMC) are hidden",
      "crm.hide.dir": "Director: full CRM · user admin unavailable",
      "crm.history": "Communication history",
      "crm.projects": "Current projects",
      "crm.deal_sum": "Deal amount",
      "crm.next": "Next step",
      "crm.status.new": "New",
      "crm.status.work": "In progress",
      "crm.status.closed": "Closed",
      "crm.c1.history0": "Message: First contact, quote request",
      "crm.c1.history1": "Call: Clarified warehouse SKUs",
      "crm.c1.project": "Alfa warehouse lighting order",
      "crm.c1.next": "Send final quote · today 15:00",
      "crm.c2.history0": "Message: Discussed specification",
      "crm.c2.history1": "Call: Timeline alignment",
      "crm.c2.history2": "File: post-quote spec → shared RU",
      "crm.c2.project": "Lighting order for Frunzensky Residential",
      "crm.c2.next": "Remind about samples · tomorrow 11:00",
      "crm.c2.exp0": "LED sample purchase",
      "crm.c2.exp1": "Ship to CN hub",
      "crm.c2.exp2": "Packing / export",
      "crm.c3.history0": "Deal closed · shipment done",
      "crm.c3.history1": "Invoice and final quote archived",
      "crm.c3.project": "Q1 linear fixtures supply",
      "crm.c3.next": "Reactivate next quarter",
      "crm.c4.history0": "Samples BOM confirmed",
      "crm.c4.history1": "Purchase + shipping logged in ¥",
      "crm.c4.project": "Street lights CN-Phase 2 · samples",
      "crm.c4.next": "Close sample expenses for project",
      "crm.c4.exp0": "Driver purchase (samples)",
      "crm.c4.exp1": "Ship samples to China",
      "crm.c5.history0": "New RFQ for 6W spot samples",
      "crm.c5.project": "Spot 6W 3000K samples batch",
      "crm.c5.next": "Buy samples + log shipping ¥",
      "crm.c5.exp0": "Spot purchase (samples)",
      "tender.t1.title": "4661969 · B2B lighting",
      "tender.t1.meta": "Submit by May 26 · 5 tasks",
      "tender.t2.title": "4652879 · Ural region",
      "tender.t2.meta": "Submit by May 22 · 2 tasks",
      "tender.t3.title": "0373100011226000001",
      "tender.t3.meta": "Shared RU · has invoice and quote",
      "tender.t4.title": "Frunzensky (order)",
      "tender.t4.meta": "Not a tender · client_order",
      "tv.found": "Found",
      "tv.work": "In progress",
      "tv.apps": "Applications",
      "tv.won": "Won",
      "tv.lost": "Lost",
      "storage.doc_types": "Document types (auto)",
      "storage.empty": "empty",
      "folder.spec": "specification",
      "folder.spec_retender": "spec with retender",
      "folder.spec_final": "final specification",
      "folder.kp_final": "final quote",
      "folder.spec_after_kp": "spec after quote",
      "folder.invoice": "invoice",
      "folder.drawings": "drawings",
      "storage.proj.frunze": "Frunzensky Residential",
      "storage.proj.alfa": "Alfa Light LLC",
      "storage.proj.t466": "Tender 4661969",
      "file.spec_v3": "spec_v3.xlsx",
      "file.kp_draft": "quote_draft.pdf",
      "file.corr": "correspondence.txt",
      "file.spec": "spec.xlsx",
      "file.kp_final": "final_quote.pdf",
      "file.spec_ret": "spec_with_retender.xlsx",
      "file.dwg_a1": "drawings_A1.pdf",
      "mail.no_token": "No token or API. Sign in (role) and tap Sync.",
      "mail.empty": "No messages",
      "mail.no_subject": "(no subject)",
      "mail.draft": "draft: ",
      "mail.no_access": "No access or API",
      "mail.manager_col": "Manager",
    },
  };

  function t(key) {
    const pack = I18N[currentLang] || I18N.en;
    if (pack[key] != null) return pack[key];
    if (I18N.en[key] != null) return I18N.en[key];
    return key;
  }

  function tf(key, vars) {
    let s = t(key);
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  function localeTag() {
    const map = {
      zh: 'zh-CN', ru: 'ru-RU', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR',
      de: 'de-DE', fr: 'fr-FR', es: 'es-ES', pt: 'pt-PT', ar: 'ar', he: 'he-IL',
    };
    return map[currentLang] || 'en-US';
  }

  function fillLangSelects() {
    document.querySelectorAll('.lang-select').forEach((sel) => {
      const prev = sel.value;
      sel.innerHTML = '';
      UI_LANGS.forEach((L) => {
        const opt = document.createElement('option');
        opt.value = L.code;
        opt.textContent = L.native;
        opt.setAttribute('lang', L.code);
        sel.appendChild(opt);
      });
      if (prev && isUiLang(prev)) sel.value = prev;
    });
  }

  function syncLangSelects(lang) {
    document.querySelectorAll('.lang-select').forEach((sel) => {
      if (sel.value !== lang) sel.value = lang;
    });
  }

  function applyLang(lang, opts) {
    lang = String(lang || '').toLowerCase();
    if (!isUiLang(lang)) lang = 'en';
    currentLang = lang;
    try { localStorage.setItem('gilil_shell_v2_lang', lang); } catch (_) {}
    const meta = langMeta(lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
    syncLangSelects(lang);
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
      else el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    try {
      if (typeof currentTheme === 'string') {
        const sel = document.getElementById('theme-select');
        const sel2 = document.getElementById('theme-select-personal');
        if (sel) sel.value = currentTheme;
        if (sel2) sel2.value = currentTheme;
        document.querySelectorAll('.theme-swatch').forEach((btn) => {
          const id = btn.getAttribute('data-theme-id');
          btn.title = t('theme.' + id);
          btn.setAttribute('aria-checked', id === currentTheme ? 'true' : 'false');
        });
      }
    } catch (_) {}

    // Refresh dynamic bits that embed translated labels
    if (typeof applyRoleUI === 'function') {
      try { applyRoleUI(); } catch (_) {}
    }
    if (typeof renderPlan === 'function') {
      try { renderPlan(); } catch (_) {}
    }
    if (typeof renderTasks === 'function') {
      try { renderTasks(); } catch (_) {}
    }
    if (typeof renderTasksPlans === 'function' && typeof currentSection !== 'undefined' && currentSection === 'tasks-plans') {
      try { renderTasksPlans(); } catch (_) {}
    }
    if (typeof renderCalendar === 'function' && typeof currentSection !== 'undefined' && currentSection === 'calendar') {
      try { renderCalendar(); } catch (_) {}
    }
    if (typeof openTaskId !== 'undefined' && openTaskId && typeof fillTaskModal === 'function') {
      const task = tasks.find((x) => x.id === openTaskId);
      if (task) {
        try { fillTaskModal(task); } catch (_) {}
      }
    }
    if (typeof renderChats === 'function' && $('#chat-groups')) {
      try { renderChats(); } catch (_) {}
    }
    if (typeof setTeamVisibility === 'function' && typeof teamVisibility !== 'undefined') {
      try {
        const lab = document.getElementById('team-vis-label');
        if (lab) lab.textContent = teamVisLabel(teamVisibility);
        document.querySelectorAll('#team-vis-menu .team-vis-opt').forEach((el) => {
          el.setAttribute('aria-selected', el.getAttribute('data-vis') === teamVisibility ? 'true' : 'false');
        });
      } catch (_) {}
    }
    if (typeof openChatThread === 'function' && typeof selectedChat !== 'undefined' && selectedChat) {
      try { openChatThread(selectedChat); } catch (_) {}
    } else {
      const titleEl = $('#chat-thread-title');
      if (titleEl && titleEl.hasAttribute('data-i18n')) {
        titleEl.textContent = t(titleEl.getAttribute('data-i18n'));
      }
    }
    if (typeof renderCrm === 'function' && $('#crm-cards')) {
      try { renderCrm(); } catch (_) {}
    }
    if (typeof renderTenders === 'function' && $('#tenders-grid')) {
      try { renderTenders(); } catch (_) {}
    }
    if (typeof renderTv === 'function' && $('#tv-stats')) {
      try { renderTv(); } catch (_) {}
    }
    if (typeof renderStorage === 'function' && $('#personal-tree')) {
      try { renderStorage(); } catch (_) {}
    }
    if (!(opts && opts.silent) && typeof toast === 'function' && $('#app-shell') && !$('#app-shell').classList.contains('hidden')) {
      const switched = (I18N[currentLang] && I18N[currentLang]['lang.switched']) || ('UI: ' + langMeta(currentLang).native);
      toast(switched);
    }
  }


  const INVOICE_STEPS = [
    { key: 'manager', labelKey: 'inv.step.manager', status: 'invoice_pending_manager' },
    { key: 'director', labelKey: 'inv.step.director', status: 'invoice_pending_director' },
    { key: 'ruslan', labelKey: 'inv.step.ruslan', status: 'invoice_pending_ruslan' },
  ];
  function statusLabel(st) {
    const k = 'status.' + st;
    return t(k) !== k ? t(k) : st;
  }
  function invStepLabel(step) {
    return t(step.labelKey);
  }

  // ——— Demo data ———
  const CHATS = {
    ru: [
      { id: 'ru-alex', nameKey: 'person.alexey_r', roleKey: 'role.chat.ru_mgr_msk', initials: 'АР', team: 'ru', unread: 0 },
      { id: 'ru-maria', nameKey: 'person.maria_k', roleKey: 'role.chat.sales_yekt', initials: 'МК', team: 'ru', unread: 2 },
      { id: 'ru-dmitry', nameKey: 'person.dmitry_s', roleKey: 'role.chat.pm_novt', initials: 'ДС', team: 'ru', unread: 0 },
      { id: 'ru-anna', nameKey: 'person.anna_p', roleKey: 'role.chat.support_msk', initials: 'АП', team: 'ru', unread: 1 },
    ],
    cn: [
      { id: 'cn-wang', nameKey: 'person.wang_li', roleKey: 'role.chat.cn_sales', initials: 'WL', team: 'cn', unread: 0 },
      { id: 'cn-zhang', nameKey: 'person.zhang_wei', roleKey: 'role.chat.factory', initials: 'ZW', team: 'cn', unread: 0 },
      { id: 'cn-li', nameKey: 'person.lina.full', roleKey: 'role.chat.supply', initials: 'LN', team: 'cn', unread: 3 },
    ],
    projects: [
      { id: 'pr-2025ru', nameKey: 'chat.pr.2025ru', roleKey: 'project.retail', initials: 'RU', team: 'pr', unread: 1 },
      { id: 'pr-cn2', nameKey: 'chat.pr.cn2', roleKey: 'project.street', initials: 'CN', team: 'pr', unread: 0 },
      { id: 'pr-led', nameKey: 'chat.pr.led', roleKey: 'project.b2b', initials: 'LP', team: 'pr', unread: 2 },
      { id: 'pr-iot', nameKey: 'chat.pr.iot', roleKey: 'project.iot', initials: 'CH', team: 'pr', unread: 0 },
      { id: 'pr-frunze', nameKey: 'chat.pr.frunze', roleKey: 'project.frunze_lights', initials: 'ЖК', team: 'pr', unread: 1 },
      { id: 'pr-t466', nameKey: 'chat.pr.t466', roleKey: 'project.tender_b2b', initials: '46', team: 'pr', unread: 0 },
    ],
    director: [
      { id: 'dir-igor', nameKey: 'role.chat.igor_dir', roleKey: 'role.chat.dir_msk', initials: 'ИД', team: 'dir', unread: 1 },
      { id: 'dir-ruslan', nameKey: 'role.chat.ruslan_admin', roleKey: 'role.chat.owner_msk', initials: 'РГ', team: 'dir', unread: 0 },
    ],
  };

  function chatDisplayName(c) { return c.nameKey ? t(c.nameKey) : (c.name || ''); }
  function chatDisplayRole(c) { return c.roleKey ? t(c.roleKey) : (c.role || ''); }

  // Demo threads: at (ISO day), media ('photo'|'file'), price {ru,cn}
  const THREADS = {
    'ru-maria': [
      { me: false, text: 'Алексей, КП по Альфа Лайт готово к отправке?', at: '2026-10-28T10:12:00' },
      { me: true, text: 'Да, финальное КП в хранилище. Отправлю сегодня до 15:00.', at: '2026-10-28T10:18:00' },
      { me: false, text: 'Клиентская цена RU: 890 000 ₽. Не дублируй CN-цифры в чат.', at: '2026-10-28T11:05:00', price: { ru: '890 000 ₽', cn: '¥ 72 500' } },
      { me: false, text: 'Ок, добавь в план галочку — директору уйдёт.', at: '2026-10-29T09:20:00' },
      {
        me: false,
        kind: 'voice',
        media: 'voice',
        text: 'Добрый день, КП по Альфа Лайт готово, отправлю до пятнадцати часов.',
        transcript: 'Добрый день, КП по Альфа Лайт готово, отправлю до пятнадцати часов.',
        translation_zh: '你好，Alfa Light 报价已准备好，十五点前发出。',
        translation: { text: '你好，Alfa Light 报价已准备好，十五点前发出。', from: 'ru', to: 'zh', provider: 'mock' },
        duration_ms: 4200,
        audioUrl: '',
        at: '2026-10-29T11:05:00',
      },
      { me: true, text: 'Фото витрины с образцами.', at: '2026-10-29T14:40:00', media: 'photo', mediaLabel: 'alfalight-samples.jpg' },
    ],
    'ru-anna': [
      { me: false, text: 'Клиент ЖК Фрунзенский ждёт образцы.', at: '2026-10-29T16:00:00' },
      { me: true, text: 'Напоминание на завтра 11:00 уже в задачах.', at: '2026-10-29T16:12:00' },
    ],
    'ru-dmitry': [
      { me: false, text: 'Нужен статус по Control Hub IoT.', at: '2026-10-27T08:30:00' },
    ],
    'cn-li': [
      { me: false, text: '弗龙泽样品明天可发货。', at: '2026-10-28T07:10:00' },
      { me: false, text: 'Samples for Frunzensky ready for ship tomorrow.', at: '2026-10-28T07:12:00' },
      { me: true, text: 'Отлично. Пришлите трек в общую папку RU.', at: '2026-10-28T07:22:00' },
      { me: false, text: '工厂报价 CNY 198000。不要在这里贴俄罗斯零售价。', at: '2026-10-28T08:00:00', price: { ru: '2 450 000 ₽', cn: '¥ 198 000' } },
      { me: false, text: 'OK, put tracking PDF under счет / tender folder.', at: '2026-10-29T05:40:00', media: 'file', mediaLabel: 'tracking-SF123.pdf' },
      { me: false, text: '包装线照片。', at: '2026-10-30T03:15:00', media: 'photo', mediaLabel: 'pack-line.jpg' },
    ],
    'cn-wang': [
      { me: false, text: 'CN-Phase 2 路灯：需要俄罗斯招标编号。', at: '2026-10-26T11:00:00' },
      { me: false, text: 'CN-Phase 2 street lights: need RU tender number.', at: '2026-10-26T11:01:00' },
    ],
    'cn-zhang': [
      { me: false, text: 'Zhongshan line free next week for LED Platform.', at: '2026-10-27T04:00:00' },
    ],
    'pr-frunze': [
      { me: false, text: 'Спецификация после КП загружена в shared RU.', at: '2026-10-27T12:00:00', media: 'file', mediaLabel: 'spec-frunze-v3.pdf' },
      { me: true, text: 'Принял. Задача на напоминание про образцы — завтра 11:00.', at: '2026-10-27T12:20:00' },
      { me: false, text: 'Сумма сделки RU: 2 450 000 ₽ · завод CNY 198000.', at: '2026-10-28T09:00:00', price: { ru: '2 450 000 ₽', cn: '¥ 198 000' } },
      { me: false, text: 'Фото макета лобби.', at: '2026-10-29T15:30:00', media: 'photo', mediaLabel: 'lobby-mock.jpg' },
    ],
    'pr-led': [
      { me: false, text: 'Нужна финальная спецификация до пятницы.', at: '2026-10-28T18:00:00' },
      { me: true, text: 'Черновик в хранилище LED Platform.', at: '2026-10-29T10:00:00', media: 'file', mediaLabel: 'led-platform-draft.docx' },
    ],
    'pr-2025ru': [
      { me: true, text: 'Старт ритейл-пакета 2025-RU.', at: '2026-10-20T09:00:00' },
      { me: false, text: 'Ритейл-цена для сети: 1 120 000 ₽ (пакет).', at: '2026-10-21T11:00:00', price: { ru: '1 120 000 ₽', cn: '¥ 91 000' } },
    ],
    'pr-cn2': [
      { me: false, text: 'Street lights BOM attached.', at: '2026-10-22T06:00:00', media: 'file', mediaLabel: 'cn-phase2-bom.xlsx' },
    ],
    'pr-iot': [
      { me: false, text: 'IoT hub firmware photo from lab.', at: '2026-10-25T14:00:00', media: 'photo', mediaLabel: 'hub-fw.jpg' },
    ],
    'pr-t466': [
      { me: false, text: 'Тендер 4661969: переторжка в папке tenders/.', at: '2026-10-24T13:00:00' },
    ],
    'dir-igor': [
      { me: false, text: 'Алексей, сводка по просроченным задачам на сегодня.', at: '2026-10-30T08:00:00' },
      { me: true, text: 'Две просрочки закрываю до 15:00. Счёт Альфа Лайт на согласовании.', at: '2026-10-30T08:15:00' },
      { me: false, text: 'Ок. Цены CN в отчёте мне не дублируй — смотрю в CRM.', at: '2026-10-30T08:20:00' },
    ],
    'dir-ruslan': [
      { me: false, text: 'Нужен статус по счёту ЖК Фрунзенский (ожидает меня).', at: '2026-10-29T19:00:00' },
    ],
  };

  let chatMsgQuery = '';
  let chatDateFrom = '';
  let chatDateTo = '';
  let chatMediaOnly = false;
  let chatPhotoOnly = false;

  // Tasks: overdue if takenAt > 1h ago and not done
  const now = Date.now();
  const HOUR = 3600000;
  let tasks = [
    {
      id: 't1',
      type: 'regular',
      titleKey: 'task.t1.title',
      descKey: 'task.t1.desc',
      takenAt: now - 2.5 * HOUR,
      dueAt: now - 1.5 * HOUR,
      ownerKey: 'person.alexey.full',
      closedAt: null,
      done: false,
      overdue: true,
    },
    {
      id: 't2',
      type: 'regular',
      titleKey: 'task.t2.title',
      descKey: 'task.t2.desc',
      takenAt: now - 1.2 * HOUR,
      dueAt: now - 0.2 * HOUR,
      ownerKey: 'person.maria_k',
      closedAt: null,
      done: false,
      overdue: true,
    },
    {
      id: 't3',
      type: 'regular',
      titleKey: 'task.t3.title',
      descKey: 'task.t3.desc',
      takenAt: now - 25 * 60000,
      dueAt: now + 3 * HOUR,
      ownerKey: 'person.alexey.full',
      closedAt: null,
      done: false,
      overdue: false,
    },
    {
      id: 't4',
      type: 'regular',
      titleKey: 'task.t4.title',
      descKey: 'task.t4.desc',
      takenAt: now - 4 * HOUR,
      dueAt: now - 3 * HOUR,
      ownerKey: 'person.ivanov',
      closedAt: now - 3 * HOUR,
      done: true,
      overdue: false,
    },
    {
      id: 'inv1',
      type: 'invoice',
      titleKey: 'inv.inv1.title',
      descKey: 'inv.inv1.desc',
      companyKey: 'company.alfa',
      amount: 890000,
      amountFmt: '890 000 ₽',
      invoiceNo: 'INV-2026-041',
      createdByKey: 'person.alexey.full',
      ownerKey: 'person.alexey.full',
      dueAt: now + 6 * HOUR,
      status: 'invoice_pending_manager',
      approvals: { manager: null, director: null, ruslan: null },
      takenAt: now - 40 * 60000,
      closedAt: null,
      done: false,
      overdue: false,
    },
    {
      id: 'inv2',
      type: 'invoice',
      titleKey: 'inv.inv2.title',
      descKey: 'inv.inv2.desc',
      companyKey: 'company.frunze',
      amount: 735000,
      amountFmt: '735 000 ₽',
      invoiceNo: 'INV-2026-038',
      createdByKey: 'person.maria_k',
      ownerKey: 'person.maria_k',
      dueAt: now - HOUR,
      status: 'invoice_pending_ruslan',
      approvals: { manager: 'approved', director: 'approved', ruslan: null },
      takenAt: now - 5 * HOUR,
      closedAt: null,
      done: false,
      overdue: false,
    },
  ];
  let taskFilter = 'all';
  let invoiceAlertShown = false;
  let invBeepPlayed = false;
  function taskTitle(task) {
    if (!task) return '';
    if (task.titleKey) return t(task.titleKey);
    if (task.type === 'invoice') {
      const co = task.companyKey ? t(task.companyKey) : (task.company || '');
      return t('invoice.title_prefix') + ' · ' + co;
    }
    return task.title || '';
  }
  function taskDesc(task) {
    if (!task) return '';
    if (task.descKey) return t(task.descKey);
    return task.desc || '';
  }
  function taskCompany(task) {
    if (!task) return '';
    if (task.companyKey) return t(task.companyKey);
    return task.company || '';
  }
  function taskCreator(task) {
    if (!task) return '';
    if (task.createdByKey) return t(task.createdByKey);
    return task.createdBy || '';
  }


  let plan = [
    { id: 'p1', titleKey: 'plan.p1.title', metaKey: 'plan.p1.meta', done: true, taskId: 't3' },
    { id: 'p2', titleKey: 'plan.p2.title', metaKey: 'plan.p2.meta', done: false, taskId: 't1' },
    { id: 'p3', titleKey: 'plan.p3.title', metaKey: 'plan.p3.meta', done: false, taskId: 't2' },
    { id: 'p4', titleKey: 'plan.p4.title', metaKey: 'plan.p4.meta', done: false, taskId: 't3' },
  ];

  const CRM = [
    {
      id: 'c1',
      nameKey: 'company.alfa',
      side: 'ru',
      status: 'new',
      contactKey: 'person.ivanov',
      phone: '+7 (495) 111-22-33',
      email: 'ivanov@alphalight.ru',
      historyKeys: ['crm.c1.history0', 'crm.c1.history1'],
      historyIcons: ['💬', '📞'],
      projectKey: 'crm.c1.project',
      amountRub: 890000,
      amountCny: null,
      amount: '890 000 ₽',
      nextKey: 'crm.c1.next',
      sampleExpenses: [],
    },
    {
      id: 'c2',
      nameKey: 'company.frunze',
      side: 'both',
      status: 'work',
      contactKey: 'person.smirnova',
      phone: '+7 (999) 123-45-67',
      email: 'frunze@email.ru',
      historyKeys: ['crm.c2.history0', 'crm.c2.history1', 'crm.c2.history2'],
      historyIcons: ['💬', '📞', '📎'],
      projectKey: 'crm.c2.project',
      amountRub: 2450000,
      amountCny: 186000,
      amount: '2 450 000 ₽',
      nextKey: 'crm.c2.next',
      sampleExpenses: [
        { titleKey: 'crm.c2.exp0', purchase_cny: 4200, shipping_cny: 680 },
        { titleKey: 'crm.c2.exp1', purchase_cny: 0, shipping_cny: 1250 },
        { titleKey: 'crm.c2.exp2', purchase_cny: 350, shipping_cny: 900 },
      ],
    },
    {
      id: 'c3',
      nameKey: 'company.seversvet',
      side: 'ru',
      status: 'closed',
      contactKey: 'person.volkov',
      phone: '+7 (812) 555-01-02',
      email: 'volkov@seversvet.ru',
      historyKeys: ['crm.c3.history0', 'crm.c3.history1'],
      historyIcons: ['✅', '📄'],
      projectKey: 'crm.c3.project',
      amountRub: 1120000,
      amountCny: null,
      amount: '1 120 000 ₽',
      nextKey: 'crm.c3.next',
      sampleExpenses: [],
    },
    {
      id: 'c4',
      nameKey: 'company.zs_factory',
      side: 'cn',
      status: 'work',
      contactKey: 'person.zhang_wei',
      phone: '+86 760 8888-0102',
      email: 'zhang@zsled.cn',
      historyKeys: ['crm.c4.history0', 'crm.c4.history1'],
      historyIcons: ['💬', '📎'],
      projectKey: 'crm.c4.project',
      amountRub: null,
      amountCny: 98500,
      amount: '¥ 98 500',
      nextKey: 'crm.c4.next',
      sampleExpenses: [
        { titleKey: 'crm.c4.exp0', purchase_cny: 1800, shipping_cny: 320 },
        { titleKey: 'crm.c4.exp1', purchase_cny: 0, shipping_cny: 2100 },
      ],
    },
    {
      id: 'c5',
      nameKey: 'company.sh_supply',
      side: 'cn',
      status: 'new',
      contactKey: 'person.wang_li',
      phone: '+86 21 5555-7788',
      email: 'wang@shsupply.cn',
      historyKeys: ['crm.c5.history0'],
      historyIcons: ['💬'],
      projectKey: 'crm.c5.project',
      amountRub: null,
      amountCny: 45200,
      amount: '¥ 45 200',
      nextKey: 'crm.c5.next',
      sampleExpenses: [
        { titleKey: 'crm.c5.exp0', purchase_cny: 2600, shipping_cny: 0 },
      ],
    },
  ];
  function crmStatusLabel(st) {
    if (st === 'new') return t('crm.status.new');
    if (st === 'work') return t('crm.status.work');
    return t('crm.status.closed');
  }
  function crmName(c) { return c.nameKey ? t(c.nameKey) : c.name; }
  function crmContact(c) { return c.contactKey ? t(c.contactKey) : c.contact; }
  function crmProject(c) { return c.projectKey ? t(c.projectKey) : c.project; }
  function crmNext(c) { return c.nextKey ? t(c.nextKey) : c.next; }

  let crmSideFilter = 'all';

  const TENDERS = [
    { titleKey: 'tender.t1.title', metaKey: 'tender.t1.meta', hot: true },
    { titleKey: 'tender.t2.title', metaKey: 'tender.t2.meta', hot: false },
    { titleKey: 'tender.t3.title', metaKey: 'tender.t3.meta', hot: false },
    { titleKey: 'tender.t4.title', metaKey: 'tender.t4.meta', hot: false },
  ];

  // Storage trees (UI shows detailed doc types from discussion)
  const PERSONAL_PROJECTS = [
    {
      id: 'pp1',
      type: 'client_order',
      titleKey: 'storage.proj.frunze',
      fileKeys: ['file.spec_v3', 'file.kp_draft', 'file.corr'],
    },
    {
      id: 'pp2',
      type: 'client_order',
      titleKey: 'storage.proj.alfa',
      fileKeys: ['file.spec', 'file.kp_final'],
    },
    {
      id: 'pp3',
      type: 'tender',
      titleKey: 'storage.proj.t466',
      fileKeys: ['file.spec_ret', 'file.dwg_a1'],
    },
  ];

  const SHARED_DOC_FOLDER_KEYS = [
    'folder.spec',
    'folder.spec_retender',
    'folder.spec_final',
    'folder.kp_final',
    'folder.spec_after_kp',
    'folder.invoice',
    'folder.drawings',
  ];
  // Stable RU folder keys used in SHARED_TENDERS file maps (internal ids)
  const FOLDER_ID = {
    spec: 'folder.spec',
    spec_retender: 'folder.spec_retender',
    spec_final: 'folder.spec_final',
    kp_final: 'folder.kp_final',
    spec_after_kp: 'folder.spec_after_kp',
    invoice: 'folder.invoice',
    drawings: 'folder.drawings',
  };

  const SHARED_TENDERS = [
    {
      no: '4661969',
      files: {
        'folder.spec_retender': ['4661969_spec_retender.xlsx'],
        'folder.kp_final': ['4661969_kp_final.pdf'],
        'folder.invoice': [],
        'folder.drawings': ['4661969_dwg.zip'],
      },
    },
    {
      no: '0373100011226000001',
      files: {
        'folder.invoice': ['schet.pdf'],
        'folder.kp_final': ['kp_final.pdf'],
        'folder.spec': ['spec_v1.xlsx'],
      },
    },
  ];

  // ——— State ———
  let currentSection = 'chats';
  let selectedCrm = 'c2';
  let selectedChat = null;
  let openTaskId = null;
  let beepPlayed = false;

  // ——— DOM helpers ———
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function fmtTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString(localeTag(), {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function playBeep(msg) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.frequency.value = 660;
      }, 120);
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        o.stop(ctx.currentTime + 0.18);
        setTimeout(() => ctx.close(), 300);
      }, 280);
    } catch (e) {
      console.warn('beep failed', e);
    }
    toast(msg || t('beep.overdue'));
  }

  function playInvoiceBeep(company, amountFmt) {
    playBeep(tf('inv.beep', { company, amount: amountFmt }));
    const el = $('#toast');
    if (el) el.classList.add('invoice-toast');
    setTimeout(() => { if (el) el.classList.remove('invoice-toast'); }, 3200);
  }

  function fmtMoney(n) {
    return Number(n).toLocaleString(localeTag()) + ' ₽';
  }

  function invoiceStepperHtml(t) {
    if (!t || t.type !== 'invoice') return '';
    const rejected = t.status === 'invoice_rejected';
    const approved = t.status === 'invoice_approved';
    const html = INVOICE_STEPS.map((step, i) => {
      const key = step.key;
      const a = t.approvals[key];
      let cls = 'inv-step';
      if (a === 'approved' || (approved && a !== 'rejected')) cls += ' done';
      else if (a === 'rejected') cls += ' rejected';
      else if (t.status === step.status) cls += ' current';
      const mark = a === 'approved' || (approved && a !== 'rejected') ? ' ✓' : (a === 'rejected' ? ' ✕' : '');
      const arrow = i < INVOICE_STEPS.length - 1 ? '<span class="inv-step-arrow">→</span>' : '';
      return `<span class="${cls}">${invStepLabel(step)}${mark}</span>${arrow}`;
    }).join('');
    return `<div class="inv-stepper">${html}</div>`;
  }

  function roleCanActOnInvoice(t) {
    if (!t || t.type !== 'invoice') return false;
    if (t.status === 'invoice_approved' || t.status === 'invoice_rejected') return false;
    if (t.status === 'invoice_pending_manager') return currentRole === 'ru';
    if (t.status === 'invoice_pending_director') return currentRole === 'director';
    if (t.status === 'invoice_pending_ruslan') return currentRole === 'admin';
    return false;
  }

  function invoicesPendingRuslan() {
    return tasks.filter((t) => t.type === 'invoice' && t.status === 'invoice_pending_ruslan');
  }

  function updateInvoiceAlert() {
    const box = $('#invoice-alert');
    if (!box) return;
    const pending = invoicesPendingRuslan();
    const nEl = $('#tf-invoice-n');
    if (nEl) {
      nEl.textContent = String(tasks.filter((t) => t.type === 'invoice' && !t.done && t.status !== 'invoice_rejected').length);
    }
    if (currentRole === 'admin' && pending.length) {
      const t = pending[0];
      box.classList.remove('hidden');
      const co = taskCompany(t);
      const alertHtml = tf('inv.alert', { company: escapeHtml(co), amount: escapeHtml(t.amountFmt) });
      const openLab = (I18N[currentLang] || I18N.en)['inv.alert_open'] || I18N.en['inv.alert_open'];
      box.innerHTML = `<span class="inv-alert-ico">🔔</span><div>${alertHtml}${pending.length > 1 ? ' <span style="color:var(--muted)">(+' + (pending.length - 1) + ')</span>' : ''}</div><button type="button" data-open-inv="${t.id}">${openLab}</button>`;
      const btn = box.querySelector('[data-open-inv]');
      if (btn) btn.addEventListener('click', () => openTaskModal(t.id));
      if (!invBeepPlayed) {
        invBeepPlayed = true;
        setTimeout(() => playInvoiceBeep(co, t.amountFmt), 400);
      }
    } else {
      box.classList.add('hidden');
      box.innerHTML = '';
    }
  }

  function applyRoleUI() {
    const u = DEMO_USER();
    const av = $('#user-av');
    const name = $('#user-name');
    const role = $('#user-role');
    if (av) av.textContent = u.initials;
    if (name) name.textContent = u.short;
    if (role) role.textContent = u.role;
    const whoAv = $('#who-av');
    const whoName = $('#who-name');
    const whoRole = $('#who-role');
    const whoCompany = $('#who-company');
    const whoTeam = $('#who-team');
    const whoLogin = $('#who-login');
    if (whoAv) whoAv.textContent = u.initials;
    if (whoName) whoName.textContent = u.name;
    if (whoRole) whoRole.textContent = u.role;
    if (whoCompany) whoCompany.textContent = u.company;
    if (whoTeam) whoTeam.textContent = u.team;
    if (whoLogin) whoLogin.textContent = u.login;
    updateInvoiceAlert();
    if (openTaskId) {
      const t = tasks.find((x) => x.id === openTaskId);
      if (t) fillTaskModal(t);
    }
    if (typeof renderCrm === 'function') renderCrm();
    applyMailRoleUI();
    applyActivityRoleUI();
    if (currentSection === 'mail') renderMail();
    if (currentSection === 'mail-stats' && isMailStatsRole()) renderMailStats();
    if (typeof renderChats === 'function') renderChats();
    if (currentSection === 'chats' && selectedChat) openChatThread(selectedChat);
  }

  function setRole(role) {
    if (!ROLES[role]) return;
    currentRole = role;
    invBeepPlayed = false;
    crmSideFilter = 'all';
    // CN managers: Chinese UI is the base. Admin/others keep current lang (full switcher).
    if (role === 'cn' && currentLang !== 'zh') {
      applyLang('zh', { silent: true });
    } else {
      applyRoleUI();
      renderPlan();
      renderTasks();
      renderCrm();
      if (currentSection === 'mail') renderMail();
      if (currentSection === 'mail-stats') renderMailStats();
      renderChats();
      if (currentSection === 'chats' && selectedChat) openChatThread(selectedChat);
      if (currentSection === 'storage') renderStorage();
      if (currentSection === 'tenders') renderTenders();
      if (currentSection === 'tv') renderTv();
    }
    trySoftLogin(ROLES[role]);
    toast(tf('toast.role', { short: DEMO_USER().short, role: DEMO_USER().role }));
    setTimeout(() => {
      if (typeof loadServerTasks === 'function') loadServerTasks();
      if (typeof loadReplyStatuses === 'function') loadReplyStatuses();
      if (typeof updateQuickRepliesUI === 'function') updateQuickRepliesUI();
    }, 600);
  }

  function trySoftLogin(u) {
    if (!u || !u.password) return;
    const rememberMe = currentAuthRemembered() || isRememberMe();
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u.username, password: u.password, rememberMe: !!rememberMe }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.token) {
          storeAuthTokens(data, rememberMe);
          try {
            localStorage.setItem('gilil_demo_user', JSON.stringify({ ...u, roleKey: u.key, id: (data.user && data.user.id) || u.id }));
          } catch (_) {}
          if (typeof loadNotifications === 'function') loadNotifications();
          if (typeof connectNotifWs === 'function') connectNotifWs();
          if (typeof loadServerTasks === 'function') loadServerTasks();
          if (typeof loadReplyStatuses === 'function') loadReplyStatuses();
          if (typeof loadServerChatsIntoSidebar === 'function') loadServerChatsIntoSidebar();
          if (typeof loadMyUsefulnessProfile === 'function') loadMyUsefulnessProfile();
        }
      })
      .catch(() => {});
  }

  // ——— Team visibility (sidebar dropdown; persist gilil_team_visibility) ———
  const TEAM_VIS_KEY = 'gilil_team_visibility';
  let teamVisibility = 'both'; // 'ru' | 'cn' | 'both'

  function loadTeamVisibility() {
    try {
      const v = localStorage.getItem(TEAM_VIS_KEY);
      if (v === 'ru' || v === 'cn' || v === 'both') teamVisibility = v;
    } catch (_) {}
  }

  function teamVisLabel(v) {
    if (v === 'ru') return t('chats.team_ru');
    if (v === 'cn') return t('chats.team_cn');
    return t('chats.teams_both');
  }

  function setTeamVisibility(v, opts) {
    opts = opts || {};
    if (v !== 'ru' && v !== 'cn' && v !== 'both') v = 'both';
    teamVisibility = v;
    try { localStorage.setItem(TEAM_VIS_KEY, v); } catch (_) {}
    const lab = document.getElementById('team-vis-label');
    if (lab) lab.textContent = teamVisLabel(v);
    document.querySelectorAll('#team-vis-menu .team-vis-opt').forEach((el) => {
      el.setAttribute('aria-selected', el.getAttribute('data-vis') === v ? 'true' : 'false');
    });
    if (opts.close !== false) {
      const menu = document.getElementById('team-vis-menu');
      const btn = document.getElementById('team-vis-btn');
      if (menu) menu.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
    // Drop stale top-pill team filters for removed RU/CN pills
    if (typeof chatGroupFilter !== 'undefined' && (chatGroupFilter === 'ru' || chatGroupFilter === 'cn')) chatGroupFilter = null;
    if (typeof renderChats === 'function') renderChats();
  }

  function toggleTeamVisMenu(force) {
    const menu = document.getElementById('team-vis-menu');
    const btn = document.getElementById('team-vis-btn');
    if (!menu || !btn) return;
    const open = force != null ? !!force : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function initTeamVisibilityUI() {
    loadTeamVisibility();
    setTeamVisibility(teamVisibility, { close: true });
    const btn = document.getElementById('team-vis-btn');
    const menu = document.getElementById('team-vis-menu');
    const wrap = document.getElementById('team-vis-wrap');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTeamVisMenu();
      });
    }
    if (menu) {
      menu.querySelectorAll('.team-vis-opt').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setTeamVisibility(el.getAttribute('data-vis'));
        });
      });
    }
    document.addEventListener('click', (e) => {
      if (!wrap) return;
      if (!wrap.contains(e.target)) toggleTeamVisMenu(false);
    });
  }

  // ——— Render chats sidebar ———
  function renderChats() {
    const root = $('#chat-groups');
    if (!root) return;
    const q = ($('#chat-search') && $('#chat-search').value || '').trim().toLowerCase();

    function filter(list) {
      if (!q) return list;
      return list.filter(
        (c) =>
          chatDisplayName(c).toLowerCase().includes(q) ||
          chatDisplayRole(c).toLowerCase().includes(q)
      );
    }

    const groups = [
      { key: 'ru', title: t('chats.team_ru'), list: filter(CHATS.ru), badge: null },
      { key: 'cn', title: t('chats.team_cn'), list: filter(CHATS.cn), badge: null },
      {
        key: 'projects',
        title: t('chats.projects'),
        list: filter(CHATS.projects),
        badge: CHATS.projects.length,
      },
      {
        key: 'director',
        title: t('chats.director'),
        list: filter(CHATS.director || []),
        badge: null,
      },
    ];

    let filteredGroups = chatGroupFilter
      ? groups.filter((g) => g.key === chatGroupFilter)
      : groups;
    // Visibility dropdown controls which of RU/CN team lists appear (projects/director always stay unless filtered)
    if (!chatGroupFilter) {
      filteredGroups = filteredGroups.filter((g) => {
        if (g.key === 'ru') return teamVisibility === 'ru' || teamVisibility === 'both';
        if (g.key === 'cn') return teamVisibility === 'cn' || teamVisibility === 'both';
        return true;
      });
    }

    root.innerHTML = filteredGroups
      .map((g) => {
        const items = g.list
          .map((c) => {
            const cav =
              c.team === 'ru' ? 'ru' : c.team === 'cn' ? 'cn' : c.team === 'dir' ? 'dir' : 'pr';
            const active = selectedChat === c.id ? ' active' : '';
            const unread = c.unread
              ? `<span class="unread">${c.unread}</span>`
              : '';
            const rBadge = typeof replyBadgeHtml === 'function' ? replyBadgeHtml(c) : '';
            return `<div class="chat-item${active}" data-chat="${c.id}">
            <div class="cav ${cav}">${c.initials}</div>
            <div class="cinfo"><div class="name">${escapeHtml(chatDisplayName(c))}</div><div class="role">${escapeHtml(chatDisplayRole(c))}</div></div>
            ${rBadge}${unread}
          </div>`;
          })
          .join('');
        const count =
          g.badge != null
            ? `<span class="count">${g.badge}</span>`
            : '';
        return `<div class="group" data-group="${g.key}">
          <div class="group-title">${g.title}${count}</div>
          ${items || `<div style="padding:8px 12px;color:var(--muted-2);font-size:12px">${t('chats.no_match')}</div>`}
        </div>`;
      })
      .join('');

    root.querySelectorAll('.chat-item').forEach((el) => {
      el.addEventListener('click', () => {
        selectedChat = el.getAttribute('data-chat');
        const all = [...CHATS.ru, ...CHATS.cn, ...CHATS.projects, ...(CHATS.director || [])];
        const hit = all.find((c) => c.id === selectedChat);
        if (hit) hit.unread = 0;
        renderChats();
        openChatThread(selectedChat);
        if (currentSection !== 'chats') {
          setSection('chats');
        }
      });
    });
  }

  function findChat(id) {
    return (
      CHATS.ru.find((c) => c.id === id) ||
      CHATS.cn.find((c) => c.id === id) ||
      CHATS.projects.find((c) => c.id === id) ||
      (CHATS.director || []).find((c) => c.id === id)
    );
  }

  /** Client mirror of server contact filter (phones/email/wechat/telegram). */
  function checkContactLeakClient(text) {
    const s = String(text || '');
    if (!s.trim()) return { ok: false, reason: 'empty_message', matched: '' };
    const checks = [
      [/(?:\+?\s*7|8)[\s\-()]*(?:\d[\s\-()]*){9,11}/, 'phone_pattern'],
      [/(?:\+?\s*86)[\s\-()]*(?:\d[\s\-()]*){8,13}/, 'phone_pattern'],
      [/(?:\d[\s\-.]*){10,}/, 'phone_pattern'],
      [/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/, 'email_pattern'],
      [/we\s*-?\s*chat/i, 'wechat_pattern'],
      [/weixin/i, 'wechat_pattern'],
      [/в[еэ]йчат|вичат/i, 'wechat_pattern'],
      [/wx\s*[=:]\s*[a-zA-Z][\w.-]{4,}/i, 'wechat_pattern'],
      [/(?:^|[^\w])@[a-zA-Z][a-zA-Z0-9_]{4,}(?:$|[^\w])/, 'telegram_pattern'],
      [/t\.me\/[a-zA-Z0-9_]+/i, 'telegram_pattern'],
      [/telegram|телеграм/i, 'telegram_pattern'],
      [/напиш(?:и|ите)\s+(?:мне\s+)?(?:в\s+)?(?:вотсап|whatsapp|телеграм|telegram)/i, 'bypass_phrase'],
      [/дай(?:те)?\s+(?:свой\s+)?(?:номер|телефон|wechat|email|почту)/i, 'bypass_phrase'],
      [/скинь(?:те)?\s+(?:номер|телефон|wechat|email)/i, 'bypass_phrase'],
      [/обмен(?:яемся|яться)?\s+(?:контакт|номер)/i, 'bypass_phrase'],
    ];
    for (const [re, reason] of checks) {
      const m = s.match(re);
      if (m) return { ok: false, reason, matched: m[0].slice(0, 40) };
    }
    return { ok: true };
  }

  function redactTextPrices(text) {
    let s = String(text || '');
    if (currentRole === 'admin' || currentRole === 'director') return s;
    if (currentRole === 'ru') {
      s = s.replace(/(?:CNY|RMB|¥|￥)\s*[\d][\d\s.,]*/gi, '' + t('price.cn_redact') + '');
      s = s.replace(/[\d][\d\s.,]*\s*(?:CNY|RMB|¥|￥|元)/gi, '' + t('price.cn_redact') + '');
      s = s.replace(/price_cn\s*[:=]\s*[^\s,;]+/gi, '' + t('price.cn_redact') + '');
    } else if (currentRole === 'cn') {
      s = s.replace(/(?:RUB|₽)\s*[\d][\d\s.,]*/gi, t('price.ru_redact'));
      s = s.replace(/[\d][\d\s.,]*\s*(?:RUB|₽|руб\.?)/gi, t('price.ru_redact'));
      s = s.replace(/price_ru\s*[:=]\s*[^\s,;]+/gi, t('price.ru_redact'));
    }
    return s;
  }

  function renderPriceCard(price) {
    if (!price) return '';
    const full = currentRole === 'admin' || currentRole === 'director';
    const showRu = full || currentRole === 'ru';
    const showCn = full || currentRole === 'cn';
    const rows = [];
    if (price.ru) {
      rows.push(
        showRu
          ? `<div class="pc-row ru"><span class="lbl">${escapeHtml(t('price.ru_lbl'))}</span><span class="val">${escapeHtml(price.ru)}</span></div>`
          : `<div class="pc-hidden">${escapeHtml(t('price.ru_hidden'))}</div>`
      );
    }
    if (price.cn) {
      rows.push(
        showCn
          ? `<div class="pc-row cn"><span class="lbl">${escapeHtml(t('price.cn_lbl'))}</span><span class="val">${escapeHtml(price.cn)}</span></div>`
          : `<div class="pc-hidden">${escapeHtml(t('price.cn_hidden'))}</div>`
      );
    }
    return `<div class="price-card">${rows.join('')}</div>`;
  }

  function renderMedia(m) {
    if (!m.media) return '';
    const label = escapeHtml(m.mediaLabel || (m.media === 'photo' ? t('media.photo') : t('media.file')));
    const ico = m.media === 'photo' ? '🖼' : '📎';
    const cls = m.media === 'photo' ? 'photo' : 'file';
    return `<div class="media-thumb ${cls}"><span class="media-ico">${ico}</span><span>${label}</span></div>`;
  }

  function msgDay(m) {
    return String(m.at || '').slice(0, 10);
  }

  function filterThreadMsgs(msgs) {
    return msgs.filter((m) => {
      if (m.sys) return true;
      const day = msgDay(m);
      if (chatDateFrom && day && day < chatDateFrom) return false;
      if (chatDateTo && day && day > chatDateTo) return false;
      if (chatPhotoOnly && m.media !== 'photo') return false;
      if (chatMediaOnly && !chatPhotoOnly && !m.media && m.kind !== 'voice') return false;
      if (chatMsgQuery) {
        const hay = ((m.text || '') + ' ' + (m.mediaLabel || '') + ' ' + (m.transcript || '')).toLowerCase();
        if (!hay.includes(chatMsgQuery)) return false;
      }
      return true;
    });
  }


  // ——— Chat auto-translate (CN↔RU↔EN), no buttons ———
  function detectMsgLang(text) {
    const s = String(text || '');
    const han = (s.match(/[\u4e00-\u9fff]/g) || []).length;
    const cyr = (s.match(/[А-Яа-яЁё]/g) || []).length;
    const lat = (s.match(/[A-Za-z]/g) || []).length;
    if (han >= 2 && han >= cyr && han >= lat * 0.4) return 'zh';
    if (cyr >= 3 && cyr >= lat) return 'ru';
    if (lat >= 3 && lat > cyr && han === 0) return 'en';
    if (han > 0) return 'zh';
    if (cyr > 0) return 'ru';
    if (lat > 0) return 'en';
    return null;
  }

  function myChatLang() {
    // Chat MT target follows role region (RU reads RU, CN reads ZH).
    // Admin/director / others follow UI language preference (Settings).
    if (currentRole === 'cn') return 'zh';
    if (currentRole === 'ru') return 'ru';
    if (isUiLang(currentLang)) return currentLang;
    return 'ru';
  }

  function peerChatLang(chat) {
    if (!chat) return myChatLang() === 'zh' ? 'ru' : 'zh';
    if (chat.team === 'cn') return 'zh';
    if (chat.team === 'ru' || chat.team === 'dir') return 'ru';
    // projects / mixed: opposite of me (RU↔CN workspace)
    return myChatLang() === 'zh' ? 'ru' : 'zh';
  }

  /** Compact phrase table (mirrors server mock for offline demo). */
  const TR_PHRASES = [
    ['弗龙泽样品明天可发货。', 'Образцы для Фрунзенского готовы к отгрузке завтра.', 'Samples for Frunzensky ready for ship tomorrow.'],
    ['工厂报价 CNY 198000。不要在这里贴俄罗斯零售价。', 'Заводская цена CNY 198000 за партию. Не вставляйте RU-розницу сюда.', 'Factory quote CNY 198000 for batch. Do not paste RU retail here.'],
    ['包装线照片。', 'Фото упаковочной линии.', 'Photo of packing line.'],
    ['CN-Phase 2 路灯：需要俄罗斯招标编号。', 'CN-Phase 2 уличные светильники: нужен номер RU-тендера.', 'CN-Phase 2 street lights: need RU tender number.'],
    ['Отлично. Пришлите трек в общую папку RU.', '很好。请把运单发到 RU 共享文件夹。', 'Great. Send tracking to RU shared folder.'],
    ['Samples for Frunzensky ready for ship tomorrow.', 'Образцы для Фрунзенского готовы к отгрузке завтра.', '弗龙泽样品明天可发货。'],
    ['Great. Send tracking to RU shared folder.', 'Отлично. Пришлите трек в общую папку RU.', '很好。请把运单发到 RU 共享文件夹。'],
    ['Factory quote CNY 198000 for batch. Do not paste RU retail here.', 'Заводская цена CNY 198000 за партию. Не вставляйте RU-розницу сюда.', '工厂报价 CNY 198000。不要在这里贴俄罗斯零售价。'],
    ['OK, put tracking PDF under счет / tender folder.', 'Ок, положите PDF трека в папку счёт / tender.', '好的，把运单 PDF 放到账单/招标文件夹。'],
    ['Photo of packing line.', 'Фото упаковочной линии.', '包装线照片。'],
    ['CN-Phase 2 street lights: need RU tender number.', 'CN-Phase 2 уличные светильники: нужен номер RU-тендера.', 'CN-Phase 2 路灯：需要俄罗斯招标编号。'],
    ['Zhongshan line free next week for LED Platform.', 'Линия в Чжуншане свободна на следующей неделе под LED Platform.', '中山产线下周空闲，可用于 LED Platform。'],
    ['Street lights BOM attached.', 'BOM уличных светильников во вложении.', '路灯 BOM 已附上。'],
    ['IoT hub firmware photo from lab.', 'Фото прошивки IoT-хаба из лаборатории.', '实验室 IoT 网关固件照片。'],
    ['Алексей, КП по Альфа Лайт готово к отправке?', '阿列克谢，Alfa Light 报价可以发了吗？', 'Alexey, is the Alfa Light quote ready to send?'],
    ['Да, финальное КП в хранилище. Отправлю сегодня до 15:00.', '是的，最终报价在存储里。今天15:00前发出。', 'Yes, final quote is in storage. I will send by 15:00 today.'],
    ['Клиентская цена RU: 890 000 ₽. Не дублируй CN-цифры в чат.', '俄侧客户价 890 000 ₽。不要在聊天里重复中国价格。', 'RU client price: 890 000 ₽. Do not paste CN figures in chat.'],
    ['Ок, добавь в план галочку — директору уйдёт.', '好的，在计划里打勾——会发给总监。', 'OK, tick it in the plan — it will go to the director.'],
    ['Фото витрины с образцами.', '样品展柜照片。', 'Photo of the sample display.'],
    ['Клиент ЖК Фрунзенский ждёт образцы.', '弗龙泽住宅客户在等样品。', 'Frunzensky client is waiting for samples.'],
    ['Напоминание на завтра 11:00 уже в задачах.', '明天11:00的提醒已在任务里。', 'Reminder for tomorrow 11:00 is already in tasks.'],
    ['Нужен статус по Control Hub IoT.', '需要 Control Hub IoT 状态。', 'Need status on Control Hub IoT.'],
    ['Спецификация после КП загружена в shared RU.', '报价后的规格已上传到 shared RU。', 'Spec after quote uploaded to shared RU.'],
    ['Принял. Задача на напоминание про образцы — завтра 11:00.', '收到。样品提醒任务——明天11:00。', 'Got it. Sample reminder task — tomorrow 11:00.'],
    ['Сумма сделки RU: 2 450 000 ₽ · завод CNY 198000.', '成交金额 RU: 2 450 000 ₽ · 工厂 CNY 198000。', 'Deal amount RU: 2 450 000 ₽ · factory CNY 198000.'],
    ['Фото макета лобби.', '大堂模型照片。', 'Lobby mockup photo.'],
    ['Нужна финальная спецификация до пятницы.', '周五前需要最终规格。', 'Need final spec by Friday.'],
    ['Черновик в хранилище LED Platform.', 'LED Platform 草稿在存储里。', 'Draft is in LED Platform storage.'],
    ['Старт ритейл-пакета 2025-RU.', '2025-RU 零售套餐启动。', 'Retail package 2025-RU kickoff.'],
    ['Ритейл-цена для сети: 1 120 000 ₽ (пакет).', '连锁零售价：1 120 000 ₽（套餐）。', 'Retail price for the chain: 1 120 000 ₽ (pack).'],
    ['Тендер 4661969: переторжка в папке tenders/.', '招标 4661969：二次报价在 tenders/ 文件夹。', 'Tender 4661969: rebid is in tenders/ folder.'],
    ['Алексей, сводка по просроченным задачам на сегодня.', '阿列克谢，今天逾期任务汇总。', 'Alexey, overdue tasks summary for today.'],
    ['Две просрочки закрываю до 15:00. Счёт Альфа Лайт на согласовании.', '两件逾期15:00前关掉。Alfa Light 账单审批中。', 'Closing two overdue items by 15:00. Alfa Light invoice pending.'],
    ['Ок. Цены CN в отчёте мне не дублируй — смотрю в CRM.', '好的。报告里别给我重复中国价格——我在 CRM 看。', 'OK. Do not duplicate CN prices in the report — I check CRM.'],
    ['Нужен статус по счёту ЖК Фрунзенский (ожидает меня).', '需要弗龙泽账单状态（等我处理）。', 'Need Frunzensky invoice status (waiting for me).'],
    ['Начните переписку…', '开始对话…', 'Start the conversation…'],
  ];

  const TR_INDEX = (() => {
    const maps = {};
    const put = (from, to, src, dst) => {
      const k = from + '>' + to;
      if (!maps[k]) maps[k] = new Map();
      maps[k].set(String(src).trim().toLowerCase(), dst);
    };
    for (const row of TR_PHRASES) {
      const tagged = row.map((x) => ({ t: x, l: detectMsgLang(x) }));
      for (const a of tagged) {
        for (const b of tagged) {
          if (!a.l || !b.l || a.l === b.l) continue;
          put(a.l, b.l, a.t, b.t);
        }
      }
    }
    return maps;
  })();

  function mockTranslateClient(text, from, to) {
    if (!text || !from || !to || from === to) return null;
    const map = TR_INDEX[from + '>' + to];
    if (!map) return '[' + to.toUpperCase() + '] ' + text;
    const hit = map.get(String(text).trim().toLowerCase());
    if (hit) return hit;
    return '[' + (to === 'zh' ? '中' : to.toUpperCase()) + '] ' + text;
  }

  function resolveAutoTranslation(text, isMine, chat) {
    const detected = detectMsgLang(text);
    if (!detected) return null;
    const my = myChatLang();
    const peer = peerChatLang(chat);
    const target = isMine ? peer : my;
    if (!target || detected === target) return null;
    const ok =
      (detected === 'zh' && (target === 'ru' || target === 'en')) ||
      (detected === 'ru' && (target === 'zh' || target === 'en')) ||
      (detected === 'en' && (target === 'zh' || target === 'ru'));
    if (!ok) return null;
    const translated = mockTranslateClient(text, detected, target);
    if (!translated || translated === text) return null;
    return { text: translated, from: detected, to: target };
  }

  function renderTranslation(tr) {
    if (!tr || !tr.text) return '';
    const lab = t('chats.auto_tr') || 'tr';
    const tag = (tr.from || '?') + '→' + (tr.to || '?');
    return (
      '<div class="msg-translation" title="' +
      escapeHtml(tag) +
      '"><span class="msg-tr-lab">' +
      escapeHtml(lab) +
      '</span> ' +
      escapeHtml(tr.text).replace(/\\n/g, '<br>') +
      '</div>'
    );
  }

  function formatMsgTime(at) {
    if (!at) return '';
    try {
      const d = new Date(at);
      if (Number.isNaN(d.getTime())) return String(at).slice(0, 16);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${dd}.${mm} ${hh}:${mi}`;
    } catch (_) {
      return '';
    }
  }

  function openChatThread(id) {
    const c = findChat(id);
    try {
      const sid = serverChatIdOf(c || id);
      if (sid && authToken()) {
        if (!THREADS[id]) THREADS[id] = [];
        if (!THREADS[id]._serverLoaded && !THREADS[id]._serverLoading) {
          THREADS[id]._serverLoading = true;
          loadServerThread(id, sid).then(() => {
            if (!THREADS[id]) THREADS[id] = [];
            THREADS[id]._serverLoaded = true;
            THREADS[id]._serverLoading = false;
          }).catch(() => {
            if (THREADS[id]) THREADS[id]._serverLoading = false;
          });
        }
      }
    } catch (_) {}
    try { if (typeof showProjectCardForChat === 'function') showProjectCardForChat(c || findChat(id)); } catch (_) {}
    const titleEl = $('#chat-thread-title');
    if (titleEl) {
      titleEl.removeAttribute('data-i18n');
      titleEl.textContent = c
        ? `${chatDisplayName(c)} · ${chatDisplayRole(c)}`
        : t('chats.select');
    }
    const raw = THREADS[id] || [{ me: false, text: t('chats.select'), at: '' }];
    const msgs = filterThreadMsgs(raw);
    const box = $('#chat-msgs');
    if (!box) return;
    if (!msgs.length) {
      box.innerHTML = '<div class="chat-empty-filter">' + escapeHtml(t('chats.no_filter')) + '</div>';
      return;
    }
    const chatMeta = c || findChat(id);
    box.innerHTML = msgs
      .map((m) => {
        if (m.sys) {
          return `<div class="bubble sys">${escapeHtml(m.text)}</div>`;
        }
        const redacted = redactTextPrices(m.text || '');
        const meta = m.at
          ? `<span class="meta">${formatMsgTime(m.at)}</span>`
          : '';
                if (m.kind === 'voice' || m.media === 'voice') {
          const src = m.audioUrl || m.media_url || '';
          const dur = m.duration_ms != null ? Math.round(Number(m.duration_ms) / 1000) : null;
          const durLab = dur != null ? tf('chats.voice_dur', { s: dur }) : '';
          const trSrc = redactTextPrices(m.transcript || m.text || '');
          const myLang = myChatLang();
          let trText = '';
          let trLab = '';
          if (m.translation && m.translation.text) {
            trText = m.translation.text;
            const to = (m.translation.to || '').toLowerCase();
            trLab = to === 'zh' || to === 'zh-cn' ? (t('chats.voice_zh') || '中文')
              : to === 'en' ? 'EN' : to === 'ru' ? 'RU' : (to || '').toUpperCase();
          }
          if (!trText && m.translation_zh) {
            trText = m.translation_zh;
            trLab = t('chats.voice_zh') || '中文';
          }
          // Auto client translate if transcript present but no translation yet
          if (!trText && trSrc) {
            const detected = detectMsgLang(trSrc) || 'ru';
            const target = myLang === detected ? (myLang === 'zh' ? 'ru' : 'zh') : myLang;
            const auto = mockTranslateClient(trSrc, detected, target);
            if (auto && auto !== trSrc) {
              trText = auto;
              trLab = target === 'zh' ? (t('chats.voice_zh') || '中文') : target === 'en' ? 'EN' : 'RU';
              m.translation = { text: auto, from: detected, to: target, provider: 'client-mock' };
              if (target === 'zh') m.translation_zh = auto;
            }
          }
          const zhSrc = redactTextPrices(trText || '');
          const trHtml = trSrc
            ? `<div class="voice-transcript">${escapeHtml(trSrc).replace(/\n/g, '<br>')}</div>`
            : `<div class="voice-transcript voice-transcript-pending">${escapeHtml(t('chats.voice_transcribing') || '…')}</div>`;
          const zhHtml = zhSrc
            ? `<div class="voice-transcript-zh"><span class="voice-zh-lab">${escapeHtml(trLab || t('chats.voice_zh') || '中文')}</span> ${escapeHtml(zhSrc).replace(/\n/g, '<br>')}</div>`
            : '';
          return `<div class="bubble voice ${m.me ? 'me' : 'them'}">${meta}<div class="voice-player"><audio controls preload="metadata" src="${escapeHtml(src)}"></audio><span class="voice-meta">🎤 ${escapeHtml(durLab)}</span>${trHtml}${zhHtml}</div>${renderPriceCard(m.price)}</div>`;
        }
        const body = escapeHtml(redacted).replace(/\n/g, '<br>');
        const tr = m.translation || resolveAutoTranslation(redacted, !!m.me, chatMeta);
        const taskBtn =
          '<button type="button" class="msg-task-btn" data-msg-task="1" title="' +
          escapeHtml(t('tfc.btn') || 'Task') +
          '">📋 ' +
          escapeHtml(t('tfc.btn') || 'Task') +
          '</button>';
        return `<div class="bubble ${m.me ? 'me' : 'them'}" data-msg-text="${escapeHtml(redacted)}">${meta}${taskBtn}<div class="msg-body">${body}</div>${renderTranslation(
          tr
        )}${renderPriceCard(m.price)}${renderMedia(m)}</div>`;
      })
      .join('');
    box.scrollTop = box.scrollHeight;
    // Optional: upgrade via /api/translate when server is up (non-blocking)
    upgradeTranslationsFromApi(box, msgs, chatMeta);
    bindMsgTaskButtons(box);
    if (typeof updateQuickRepliesUI === 'function') updateQuickRepliesUI();
  }

  function upgradeTranslationsFromApi(box, msgs, chatMeta) {
    if (!box || !msgs || !msgs.length) return;
    const my = myChatLang();
    const peer = peerChatLang(chatMeta);
    const bubbles = box.querySelectorAll('.bubble:not(.sys)');
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;

    msgs.forEach((m, i) => {
      if (m.sys) return;
      const el = bubbles[i];
      if (!el) return;

      // Voice: transcript present but no translation line — request server translate to user lang
      if ((m.kind === 'voice' || m.media === 'voice') && !(m.translation && m.translation.text) && !m.translation_zh) {
        const trSrc = redactTextPrices(m.transcript || m.text || '');
        if (trSrc && !el.querySelector('.voice-transcript-zh')) {
          const detected = detectMsgLang(trSrc) || 'ru';
          const target = my === detected ? (my === 'zh' ? 'ru' : 'zh') : my;
          fetch('/api/translate', {
            method: 'POST',
            headers,
            body: JSON.stringify({ text: trSrc, target, source: detected }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (!data || !data.text || data.text === trSrc) return;
              if (/^\[(中|EN|RU)\]\s/.test(data.text)) return;
              m.translation = { text: data.text, from: data.from || detected, to: data.to || target, provider: data.provider };
              if ((data.to || target) === 'zh') m.translation_zh = data.text;
              const player = el.querySelector('.voice-player');
              if (!player || player.querySelector('.voice-transcript-zh')) return;
              const lab = (data.to || target) === 'zh' ? (t('chats.voice_zh') || '中文')
                : (data.to || target) === 'en' ? 'EN' : 'RU';
              player.insertAdjacentHTML(
                'beforeend',
                `<div class="voice-transcript-zh"><span class="voice-zh-lab">${escapeHtml(lab)}</span> ${escapeHtml(data.text).replace(/\n/g, '<br>')}</div>`
              );
            })
            .catch(() => {});
        }
      }

      if (m.kind === 'voice' || m.media === 'voice') return; // voice uses translation_zh block, not msg-translation

      const redacted = redactTextPrices(m.text || '');
      const detected = detectMsgLang(redacted);
      const target = m.me ? peer : my;
      if (!detected || !target || detected === target) return;
      fetch('/api/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: redacted,
          isMine: !!m.me,
          myLang: my,
          peerLang: peer,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !data.translation || !data.translation.text) return;
          let node = el.querySelector('.msg-translation');
          const html = renderTranslation(data.translation);
          if (!html) return;
          if (node) {
            node.outerHTML = html;
          } else {
            const body = el.querySelector('.msg-body');
            if (body) body.insertAdjacentHTML('afterend', html);
          }
        })
        .catch(() => {});
    });
  }

  function showChatLeak(reason, matched) {
    const el = $('#chat-leak-banner');
    if (!el) return;
    const map = {
      phone_pattern: t('leak.phone'),
      email_pattern: t('leak.email'),
      wechat_pattern: t('leak.wechat'),
      telegram_pattern: t('leak.telegram'),
      bypass_phrase: t('leak.bypass'),
      empty_message: t('leak.empty'),
    };
    const r = map[reason] || reason;
    const m = matched ? ': «' + matched + '»' : '';
    el.textContent = tf('leak.msg', { reason: r, matched: m });
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 8000);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ——— Plan ———
  function renderPlan() {
    const root = $('#plan-list');
    if (!root) return;
    root.innerHTML = plan
      .map((p) => {
        const title = p.titleKey ? t(p.titleKey) : (p.title || '');
        const meta = p.metaKey ? t(p.metaKey) : (p.meta || '');
        const openHint = p.taskId ? ' data-plan-task="' + escapeHtml(p.taskId) + '"' : '';
        return `<div class="plan-item${p.done ? ' done' : ''}${p.taskId ? ' plan-item--linked' : ''}" data-plan="${p.id}"${openHint}>
        <input type="checkbox" ${p.done ? 'checked' : ''} data-plan-check="${p.id}" aria-label="done" />
        <div class="plan-body" data-plan-open="1">
          <div class="ptitle">${escapeHtml(title)}</div>
          <div class="pmeta">${escapeHtml(meta)}</div>
        </div>
      </div>`;
      })
      .join('');

    root.querySelectorAll('[data-plan-check]').forEach((cb) => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = cb.getAttribute('data-plan-check');
        const item = plan.find((x) => x.id === id);
        if (!item) return;
        item.done = cb.checked;
        renderPlan();
        const title = item.titleKey ? t(item.titleKey) : (item.title || '');
        if (cb.checked) {
          toast(tf('toast.plan_on', { title }));
        } else {
          toast(t('toast.plan_off'));
        }
      });
    });
    // Clicking plan title/meta opens the linked task detail modal (not the tiny toast-only path)
    root.querySelectorAll('.plan-item').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('input[type=checkbox], [data-plan-check]')) return;
        const tid = row.getAttribute('data-plan-task');
        if (tid) openTaskModal(tid);
      });
    });
  }

  // ——— Tasks ———
  function openTasksCount() {
    return tasks.filter((t) => !t.done).length;
  }
  function overdueCount() {
    return tasks.filter((t) => !t.done && t.overdue && t.type !== 'invoice').length;
  }
  function waitingInvoiceCount() {
    return tasks.filter(
      (t) =>
        t.type === 'invoice' &&
        !t.done &&
        t.status !== 'invoice_rejected' &&
        t.status !== 'invoice_approved'
    ).length;
  }

  function filteredTasks() {
    if (taskFilter === 'invoice') return tasks.filter((t) => t.type === 'invoice');
    if (taskFilter === 'regular') return tasks.filter((t) => t.type !== 'invoice');
    return tasks;
  }

  function updateTaskBadges() {
    const n = openTasksCount();
    const od = overdueCount();
    const wait = waitingInvoiceCount();
    const badge = $('#chip-task-badge') || $('#pill-task-badge');
    const fab = $('#fab-tasks');
    const fabN = $('#fab-count');
    if (n > 0) {
      if (badge) {
        badge.textContent = String(n);
        badge.classList.remove('hidden');
        badge.setAttribute('aria-hidden', 'false');
      }
      fab.classList.remove('hidden');
      fabN.textContent = String(n);
      fab.classList.toggle('quiet', od === 0 && !(currentRole === 'admin' && invoicesPendingRuslan().length));
    } else {
      if (badge) {
        badge.classList.add('hidden');
        badge.setAttribute('aria-hidden', 'true');
      }
      fab.classList.add('quiet');
      fabN.textContent = '0';
    }
    $('#stat-active').textContent = String(n);
    $('#stat-overdue').textContent = String(od);
    $('#stat-done').textContent = String(tasks.filter((t) => t.done).length);
    $('#stat-wait').textContent = String(wait);
    updateInvoiceAlert();
    const tpBadge = $('#pill-tasks-plans-badge');
    if (tpBadge) {
      if (n > 0) {
        tpBadge.textContent = String(n);
        tpBadge.hidden = false;
        tpBadge.removeAttribute('hidden');
      } else {
        tpBadge.hidden = true;
        tpBadge.setAttribute('hidden', '');
      }
    }
  }

  function invoiceBadge(task) {
    if (task.status === 'invoice_approved')
      return '<span class="tbadge approved">' + escapeHtml(statusLabel('invoice_approved')) + '</span>';
    if (task.status === 'invoice_rejected')
      return '<span class="tbadge rejected">' + escapeHtml(statusLabel('invoice_rejected')) + '</span>';
    return '<span class="tbadge invoice">' + escapeHtml(statusLabel(task.status) || t('status.invoice_fallback')) + '</span>';
  }

  function renderTasks() {
    const root = $('#tasks-list');
    if (!root) return;
    const list = filteredTasks();
    $$('#task-filters .tf').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-filter') === taskFilter);
    });
    if (!list.length) {
      root.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:13px">' + escapeHtml(t('task.empty_filter')) + '</div>';
      updateTaskBadges();
      return;
    }
    root.innerHTML = list
      .map((task) => {
        const isInv = task.type === 'invoice';
        const cls = [
          'task-row',
          isInv ? 'invoice' : '',
          task.done ? 'done' : '',
          !task.done && task.overdue && !isInv ? 'overdue' : '',
        ]
          .filter(Boolean)
          .join(' ');
        let badge;
        if (isInv) {
          badge = invoiceBadge(task);
        } else if (task.done) {
          badge = '<span class="tbadge">' + escapeHtml(t('task.badge.done')) + '</span>';
        } else if (task.overdue) {
          badge = '<span class="tbadge">' + escapeHtml(t('task.badge.overdue')) + '</span>';
        } else {
          badge =
            '<span class="tbadge" style="background:rgba(20,184,166,.12);color:#5eead4;border-color:rgba(20,184,166,.3)">' +
            escapeHtml(t('task.badge.progress')) +
            '</span>';
        }
        const bodyExtra = isInv
          ? `<div class="ttiming"><span class="inv-amount">${escapeHtml(task.amountFmt)}</span> · ${escapeHtml(task.invoiceNo)} · ${escapeHtml(t('task.created_by'))} ${escapeHtml(taskCreator(task))}</div>${invoiceStepperHtml(task)}`
          : `<div class="ttiming">${escapeHtml(t('task.taken'))} ${fmtTime(task.takenAt)} · ${escapeHtml(t('task.closed'))} ${fmtTime(task.closedAt)}</div>`;
        const check = isInv
          ? '<span class="tcheck" style="width:20px;text-align:center;opacity:.5">🧾</span>'
          : `<input type="checkbox" class="tcheck" ${task.done ? 'checked' : ''} data-task-check="${task.id}" />`;
        return `<div class="${cls}" data-task="${task.id}">
          ${check}
          <div class="tbody">
            <div class="ttitle">${escapeHtml(taskTitle(task))}</div>
            ${bodyExtra}
          </div>
          ${badge}
        </div>`;
      })
      .join('');

    root.querySelectorAll('.task-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        // Checkbox toggles done state only — do not open modal
        if (e.target.closest('input[type=checkbox], [data-task-check]')) return;
        const tid = row.getAttribute('data-task');
        if (tid) openTaskModal(tid);
      });
    });
    root.querySelectorAll('[data-task-check]').forEach((cb) => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => {
        toggleTask(cb.getAttribute('data-task-check'), cb.checked);
      });
    });
    updateTaskBadges();
    if (typeof renderTasksPlans === 'function' && currentSection === 'tasks-plans') renderTasksPlans();
  }

  function taskOwnerLabel(task) {
    if (!task) return '';
    if (task.ownerKey) return t(task.ownerKey);
    if (task.owner) return task.owner;
    if (task.createdByKey) return t(task.createdByKey);
    if (task.createdBy) return task.createdBy;
    return t('tp.owner_default');
  }

  function taskDueLabel(task) {
    if (!task) return '—';
    const ts = task.dueAt || task.closedAt || (task.takenAt ? task.takenAt + HOUR : null);
    if (!ts) return '—';
    return fmtTime(ts);
  }

  function taskStatusLabelTp(task) {
    if (!task) return '';
    if (task.type === 'invoice') {
      return statusLabel(task.status) || t('tp.status_invoice');
    }
    if (task.done) return t('tp.status_done');
    if (task.overdue) return t('tp.status_overdue');
    return t('tp.status_progress');
  }

  function renderTasksPlans() {
    const tbody = $('#tp-tbody');
    const empty = $('#tp-empty');
    if (!tbody) return;
    const list = tasks.slice().sort((a, b) => {
      const ad = a.done ? 1 : 0;
      const bd = b.done ? 1 : 0;
      if (ad !== bd) return ad - bd;
      const at = a.dueAt || a.takenAt || 0;
      const bt = b.dueAt || b.takenAt || 0;
      return at - bt;
    });
    const badge = $('#pill-tasks-plans-badge');
    const openN = list.filter((x) => !x.done).length;
    if (badge) {
      if (openN > 0) {
        badge.textContent = String(openN);
        badge.hidden = false;
        badge.removeAttribute('hidden');
      } else {
        badge.hidden = true;
        badge.setAttribute('hidden', '');
      }
    }
    if (!list.length) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    tbody.innerHTML = list
      .map((task) => {
        const st = taskStatusLabelTp(task);
        const cls = [
          task.done ? 'tp-done' : '',
          !task.done && task.overdue && task.type !== 'invoice' ? 'tp-overdue' : '',
          task.type === 'invoice' ? 'tp-invoice' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `<tr class="${cls}" data-tp-task="${task.id}" style="cursor:pointer">
          <td><strong>${escapeHtml(taskTitle(task))}</strong></td>
          <td><span class="tbadge">${escapeHtml(st)}</span></td>
          <td>${escapeHtml(taskDueLabel(task))}</td>
          <td>${escapeHtml(taskOwnerLabel(task))}</td>
        </tr>`;
      })
      .join('');
    tbody.querySelectorAll('[data-tp-task]').forEach((row) => {
      row.addEventListener('click', () => {
        const tid = row.getAttribute('data-tp-task');
        if (tid) openTaskModal(tid);
      });
    });
  }

  function addTasksPlansTask() {
    const id = 'tp' + Date.now().toString(36);
    const title = window.prompt(t('tp.new_title'), t('tp.new_title'));
    if (title === null) return;
    const name = String(title || '').trim() || t('tp.new_title');
    tasks.unshift({
      id,
      type: 'regular',
      title: name,
      desc: t('tp.new_desc'),
      takenAt: Date.now(),
      dueAt: Date.now() + 4 * HOUR,
      ownerKey: 'person.alexey.full',
      closedAt: null,
      done: false,
      overdue: false,
    });
    renderTasks();
    renderTasksPlans();
    toast(t('tp.added'));
  }

  function toggleTask(id, done) {
    const task = tasks.find((x) => x.id === id);
    if (!task) return;
    task.done = done;
    task.closedAt = done ? Date.now() : null;
    if (done) task.overdue = false;
    else task.overdue = Date.now() - task.takenAt > HOUR;
    renderTasks();
    if (openTaskId === id) fillTaskModal(task);
    if (task.serverId && typeof apiFetch === 'function') {
      apiFetch('/api/tasks/' + task.serverId, {
        method: 'PATCH',
        body: { done: !!done },
      }).catch(() => {});
    }
    if (done) {
      toast(t('toast.task_on'));
    } else {
      toast(t('toast.task_off'));
    }
  }

  function openTaskModal(id) {
    const task = tasks.find((x) => x.id === id);
    if (!task) return;
    openTaskId = id;
    try {
      if (typeof toggleNotifPanel === 'function') toggleNotifPanel(false);
      if (typeof toggleThemePopover === 'function') toggleThemePopover(false);
    } catch (_) {}
    try {
      fillTaskModal(task);
    } catch (err) {
      console.warn('fillTaskModal', err);
    }
    const modal = document.getElementById('task-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.zIndex = '1600';
    modal.setAttribute('aria-hidden', 'false');
    // Ensure full panel is painted above personal / chats chrome
    try {
      const card = modal.querySelector('.modal');
      if (card) card.scrollTop = 0;
      const closeBtn = document.getElementById('task-modal-close');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    } catch (_) {}
  }

  function fillTaskModal(task) {
    $('#tm-title').textContent = taskTitle(task);
    $('#tm-desc').textContent = taskDesc(task);
    const invBlock = $('#tm-invoice-block');
    const regBlock = $('#tm-regular-block');
    const actReg = $('#tm-actions-regular');
    const actInv = $('#tm-actions-invoice');
    if (task.type === 'invoice') {
      invBlock.classList.remove('hidden');
      regBlock.classList.add('hidden');
      actReg.classList.add('hidden');
      actInv.classList.remove('hidden');
      $('#tm-company').textContent = taskCompany(task);
      $('#tm-amount').textContent = task.amountFmt;
      $('#tm-invno').textContent = task.invoiceNo;
      $('#tm-creator').textContent = taskCreator(task);
      const st = $('#tm-stepper');
      st.innerHTML = '';
      st.className = 'invoice-stepper';
      INVOICE_STEPS.forEach((step, i) => {
        const key = step.key;
        const a = task.approvals[key];
        const span = document.createElement('span');
        span.className = 'inv-step';
        if (a === 'approved' || task.status === 'invoice_approved') span.classList.add('done');
        else if (a === 'rejected') span.classList.add('rejected');
        else if (task.status === step.status) span.classList.add('current');
        span.textContent = invStepLabel(step) + (a === 'approved' || task.status === 'invoice_approved' ? ' ✓' : a === 'rejected' ? ' ✕' : '');
        st.appendChild(span);
        if (i < INVOICE_STEPS.length - 1) {
          const ar = document.createElement('span');
          ar.className = 'inv-step-arrow';
          ar.textContent = '→';
          st.appendChild(ar);
        }
      });
      $('#tm-status-line').textContent = statusLabel(task.status) || task.status;
      const can = roleCanActOnInvoice(task);
      $('#tm-approve').disabled = !can;
      $('#tm-reject').disabled = !can;
      $('#tm-approve').style.opacity = can ? '1' : '.45';
      $('#tm-reject').style.opacity = can ? '1' : '.45';
      if (!can) {
        if (task.status === 'invoice_approved') {
          $('#tm-status-line').textContent = t('tm.status_all_ok');
        } else if (task.status === 'invoice_rejected') {
          $('#tm-status-line').textContent = t('tm.status_stopped');
        } else {
          const need =
            task.status === 'invoice_pending_manager'
              ? t('tm.need_ru')
              : task.status === 'invoice_pending_director'
                ? t('tm.need_dir')
                : t('tm.need_admin');
          $('#tm-status-line').textContent =
            statusLabel(task.status) + tf('tm.switch_role', { need });
        }
      }
    } else {
      invBlock.classList.add('hidden');
      regBlock.classList.remove('hidden');
      actReg.classList.remove('hidden');
      actInv.classList.add('hidden');
      $('#tm-taken').textContent = fmtTime(task.takenAt);
      $('#tm-closed').textContent = fmtTime(task.closedAt);
      $('#tm-check').textContent = task.done ? t('tm.check_off') : t('tm.check_on');
    }
  }

  function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
    openTaskId = null;
  }

  function approveInvoice(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.type !== 'invoice' || !roleCanActOnInvoice(t)) {
      toast(t('toast.no_right'));
      return;
    }
    if (t.status === 'invoice_pending_manager') {
      t.approvals.manager = 'approved';
      t.status = 'invoice_pending_director';
      toast(t('toast.mgr_ok'));
    } else if (t.status === 'invoice_pending_director') {
      t.approvals.director = 'approved';
      t.status = 'invoice_pending_ruslan';
      invBeepPlayed = false;
      toast(t('toast.dir_ok'));
    } else if (t.status === 'invoice_pending_ruslan') {
      t.approvals.ruslan = 'approved';
      t.status = 'invoice_approved';
      t.done = true;
      t.closedAt = Date.now();
      toast(t('toast.ruslan_ok'));
    }
    renderTasks();
    fillTaskModal(t);
    updateInvoiceAlert();
  }

  function rejectInvoice(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.type !== 'invoice' || !roleCanActOnInvoice(t)) {
      toast(t('toast.no_right'));
      return;
    }
    if (t.status === 'invoice_pending_manager') t.approvals.manager = 'rejected';
    else if (t.status === 'invoice_pending_director') t.approvals.director = 'rejected';
    else if (t.status === 'invoice_pending_ruslan') t.approvals.ruslan = 'rejected';
    t.status = 'invoice_rejected';
    t.done = true;
    t.closedAt = Date.now();
    toast(t('toast.inv_rej'));
    renderTasks();
    fillTaskModal(t);
    updateInvoiceAlert();
  }

  function createInvoice(company, amount, desc) {
    const u = DEMO_USER();
    const n = amount;
    const id = 'inv' + Date.now();
    const invNo = desc && /INV-/i.test(desc) ? desc.split('·')[0].trim() : 'INV-2026-' + String(Math.floor(Math.random() * 900) + 100);
    const task = {
      id,
      type: 'invoice',
      company,
      desc: desc || undefined,
      amount: n,
      amountFmt: fmtMoney(n),
      invoiceNo: invNo,
      createdByKey: u.nameKey,
      createdBy: u.name,
      status: 'invoice_pending_manager',
      approvals: { manager: null, director: null, ruslan: null },
      takenAt: Date.now(),
      closedAt: null,
      done: false,
      overdue: false,
    };
    tasks.unshift(task);
    taskFilter = 'invoice';
    renderTasks();
    toast(t('toast.inv_created'));
    openTaskModal(id);
  }

  function openInvoiceCreate() {
    $('#invoice-create-modal').classList.remove('hidden');
    $('#inv-company').value = '';
    $('#inv-amount').value = '';
    $('#inv-desc').value = '';
    $('#inv-company').focus();
  }
  function closeInvoiceCreate() {
    $('#invoice-create-modal').classList.add('hidden');
  }

  // ——— CRM ———
  function crmVisibleList() {
    return CRM.filter((c) => {
      if (isFullCrm()) {
        if (crmSideFilter === 'all') return true;
        if (crmSideFilter === 'ru') return c.side === 'ru' || c.side === 'both';
        if (crmSideFilter === 'cn') return c.side === 'cn' || c.side === 'both';
        return true;
      }
      if (currentRole === 'ru') return c.side === 'ru' || c.side === 'both';
      if (currentRole === 'cn') return c.side === 'cn' || c.side === 'both';
      return false;
    });
  }

  function fmtCny(n) {
    return '¥ ' + Number(n || 0).toLocaleString(localeTag());
  }

  function sampleExpenseTotals(list) {
    return (list || []).reduce(
      (a, e) => ({
        purchase: a.purchase + (e.purchase_cny || 0),
        shipping: a.shipping + (e.shipping_cny || 0),
        total: a.total + (e.purchase_cny || 0) + (e.shipping_cny || 0),
      }),
      { purchase: 0, shipping: 0, total: 0 }
    );
  }


  // ——— Website leads («Заявки») ———
  let leadsItems = [];
  let leadsFilter = 'all';
  let selectedLeadId = null;

  function leadStatusUi(st) {
    if (st === 'new') return 'new';
    if (st === 'in_progress') return 'work';
    return 'closed';
  }

  function leadStatusLabel(st) {
    return t('leads.status.' + (st || 'new')) || st;
  }

  function leadKindLabel(k) {
    return t('leads.kind.' + (k || 'client_order')) || k;
  }

  function leadSourceLabel(s) {
    if (!s || s === 'website' || s === 'сайт') return t('leads.source.website');
    return s;
  }

  async function loadAndRenderLeads() {
    const r = await mailApi('/api/leads');
    if (r.status !== 200) {
      leadsItems = [];
      renderLeads({ error: true });
      return;
    }
    leadsItems = r.data.items || [];
    const badge = $('#pill-leads-badge');
    const nNew = (r.data.counts && r.data.counts.new) || leadsItems.filter((x) => x.status === 'new').length;
    if (badge) {
      if (nNew > 0) {
        badge.hidden = false;
        badge.textContent = String(nNew);
      } else {
        badge.hidden = true;
      }
    }
    renderLeads();
  }

  function renderLeads(opts) {
    const list = $('#leads-cards');
    const det = $('#leads-detail');
    const filters = $('#leads-filters');
    const countLbl = $('#leads-count-label');
    if (!list || !det) return;

    if (filters) {
      filters.innerHTML = ['all', 'new', 'in_progress', 'closed']
        .map((s) => {
          const label = s === 'all' ? t('leads.filter.all') : leadStatusLabel(s);
          const active = leadsFilter === s ? ' active' : '';
          return `<button type="button" class="tf${active}" data-lead-filter="${s}">${escapeHtml(label)}</button>`;
        })
        .join('');
      filters.querySelectorAll('[data-lead-filter]').forEach((b) => {
        b.addEventListener('click', () => {
          leadsFilter = b.getAttribute('data-lead-filter');
          renderLeads();
        });
      });
    }

    if (opts && opts.error) {
      list.innerHTML = '<div style="padding:10px;color:var(--muted);font-size:13px">' + escapeHtml(t('leads.load_err')) + '</div>';
      if (countLbl) countLbl.textContent = '';
      return;
    }

    const visible =
      leadsFilter === 'all'
        ? leadsItems.slice()
        : leadsItems.filter((x) => x.status === leadsFilter);

    if (countLbl) countLbl.textContent = String(visible.length);

    if (!visible.length) {
      list.innerHTML = '<div style="padding:10px;color:var(--muted);font-size:13px">' + escapeHtml(t('leads.empty')) + '</div>';
      det.innerHTML = '<p style="color:var(--muted);font-size:13px">' + escapeHtml(t('leads.pick')) + '</p>';
      return;
    }

    if (!visible.find((x) => String(x.id) === String(selectedLeadId))) {
      selectedLeadId = visible[0].id;
    }

    list.innerHTML = visible
      .map((c) => {
        const st = leadStatusUi(c.status);
        const sel = String(c.id) === String(selectedLeadId) ? ' selected' : '';
        const contact = [c.email, c.phone].filter(Boolean).join(' · ') || '—';
        return `<div class="crm-card${sel}" data-lead="${c.id}">
        <span class="status ${st}">${escapeHtml(leadStatusLabel(c.status))}</span>
        <span class="side-chip ru">${escapeHtml(leadSourceLabel(c.source))}</span>
        <div class="cname">${escapeHtml(c.name || '—')}</div>
        <div class="cmeta">${escapeHtml(c.company || '—')} · ${escapeHtml(contact)}</div>
      </div>`;
      })
      .join('');

    list.querySelectorAll('[data-lead]').forEach((el) => {
      el.addEventListener('click', () => {
        selectedLeadId = el.getAttribute('data-lead');
        renderLeads();
      });
    });

    const c = visible.find((x) => String(x.id) === String(selectedLeadId)) || visible[0];
    const contact = [c.email, c.phone].filter(Boolean).join(' · ') || '—';
    const statusBtns = ['new', 'in_progress', 'closed']
      .map((s) => {
        const active = c.status === s ? ' teal' : ' ghost';
        return `<button type="button" class="btn${active}" data-lead-status="${s}" style="font-size:12px">${escapeHtml(leadStatusLabel(s))}</button>`;
      })
      .join(' ');

    det.innerHTML = `
      <div class="dhead">
        <div>
          <h2>${escapeHtml(c.name || '—')}</h2>
          <div class="contacts">
            ${escapeHtml(c.company || '—')} · ${escapeHtml(contact)}
            ${c.email ? ' · <a href="mailto:' + escapeHtml(c.email) + '">' + escapeHtml(c.email) + '</a>' : ''}
            ${c.phone ? ' · <a href="tel:' + escapeHtml(c.phone) + '">' + escapeHtml(c.phone) + '</a>' : ''}
          </div>
        </div>
        <span class="status ${leadStatusUi(c.status)}">${escapeHtml(leadStatusLabel(c.status))}</span>
      </div>
      <div class="card" style="margin-bottom:12px">
        <h2>${escapeHtml(t('leads.message'))}</h2>
        <p style="margin:0;white-space:pre-wrap;font-size:13.5px;line-height:1.45">${escapeHtml(c.message || c.text || '—')}</p>
      </div>
      <div class="card" style="margin-bottom:12px">
        <div style="display:grid;gap:6px;font-size:13px;color:var(--muted)">
          <div><strong style="color:var(--text)">${escapeHtml(t('leads.source'))}:</strong> ${escapeHtml(leadSourceLabel(c.source))}</div>
          <div><strong style="color:var(--text)">${escapeHtml(t('leads.kind'))}:</strong> ${escapeHtml(leadKindLabel(c.kind))}</div>
          <div><strong style="color:var(--text)">${escapeHtml(t('leads.project_type'))}:</strong> ${escapeHtml(c.project_type || '—')}</div>
          <div><strong style="color:var(--text)">${escapeHtml(t('leads.date'))}:</strong> ${escapeHtml(c.created_at || '—')}</div>
        </div>
      </div>
      <div class="card">
        <h2>${escapeHtml(t('leads.set_status'))}</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${statusBtns}</div>
      </div>
    `;

    det.querySelectorAll('[data-lead-status]').forEach((b) => {
      b.addEventListener('click', async () => {
        const st = b.getAttribute('data-lead-status');
        const r = await mailApi('/api/leads/' + c.id, { method: 'PATCH', body: { status: st } });
        if (r.status === 200 && r.data.lead) {
          const idx = leadsItems.findIndex((x) => String(x.id) === String(c.id));
          if (idx >= 0) leadsItems[idx] = r.data.lead;
          renderLeads();
          const badge = $('#pill-leads-badge');
          const nNew = leadsItems.filter((x) => x.status === 'new').length;
          if (badge) {
            badge.hidden = nNew <= 0;
            badge.textContent = String(nNew);
          }
        } else {
          toast(t('leads.load_err'));
        }
      });
    });
  }

  function renderCrm() {
    const list = $('#crm-cards');
    if (!list) return;
    const visible = crmVisibleList();
    const scope = $('#crm-scope-label');
    if (scope) {
      scope.textContent = isFullCrm()
        ? (currentRole === 'admin' ? t('crm.scope.admin') : t('crm.scope.director'))
        : currentRole === 'ru'
          ? t('crm.scope.ru')
          : t('crm.scope.cn');
    }

    const filters = $('#crm-side-filters');
    if (filters) {
      if (isFullCrm()) {
        filters.innerHTML = ['all', 'ru', 'cn']
          .map((s) => {
            const label = s === 'all' ? t('crm.filter.all') : s.toUpperCase();
            const active = crmSideFilter === s ? ' active' : '';
            return `<button type="button" class="tf${active}" data-crm-side="${s}">${label}</button>`;
          })
          .join('');
        filters.querySelectorAll('[data-crm-side]').forEach((b) => {
          b.addEventListener('click', () => {
            crmSideFilter = b.getAttribute('data-crm-side');
            renderCrm();
          });
        });
      } else {
        filters.innerHTML = '';
      }
    }

    const adminBox = $('#crm-admin-box');
    if (adminBox) {
      adminBox.classList.toggle('hidden', currentRole !== 'admin');
      if (currentRole === 'admin') {
        if (typeof bindSmtpAllowlistForm === 'function') bindSmtpAllowlistForm();
        if (typeof loadSmtpAllowlist === 'function') loadSmtpAllowlist();
      }
    }

    if (!visible.length) {
      list.innerHTML = '<div style="padding:10px;color:var(--muted);font-size:13px">' + escapeHtml(t('crm.empty')) + '</div>';
      $('#crm-detail').innerHTML = '';
      return;
    }
    if (!visible.find((x) => x.id === selectedCrm)) {
      selectedCrm = visible[0].id;
    }

    list.innerHTML = visible
      .map((c) => {
        const st = c.status === 'new' ? 'new' : c.status === 'work' ? 'work' : 'closed';
        const sel = c.id === selectedCrm ? ' selected' : '';
        const chip = `<span class="side-chip ${c.side}">${c.side}</span>`;
        let metaAmt = '';
        if (isFullCrm()) {
          metaAmt = escapeHtml(c.amount || '—');
        } else if (currentRole === 'ru') {
          metaAmt = c.amountRub != null ? Number(c.amountRub).toLocaleString(localeTag()) + ' ₽' : '—';
        } else {
          const tot = sampleExpenseTotals(c.sampleExpenses);
          metaAmt = tot.total ? fmtCny(tot.total) + ' ' + t('crm.samples_suffix') : escapeHtml(c.amount || '—');
        }
        return `<div class="crm-card${sel}" data-crm="${c.id}">
        <span class="status ${st}">${escapeHtml(crmStatusLabel(c.status))}</span>${chip}
        <div class="cname">${escapeHtml(crmName(c))}</div>
        <div class="cmeta">${escapeHtml(t('crm.contact'))}: ${escapeHtml(crmContact(c))} · ${metaAmt}</div>
      </div>`;
      })
      .join('');

    list.querySelectorAll('.crm-card').forEach((el) => {
      el.addEventListener('click', () => {
        selectedCrm = el.getAttribute('data-crm');
        renderCrm();
      });
    });

    const c = visible.find((x) => x.id === selectedCrm) || visible[0];
    const det = $('#crm-detail');
    const showRub = isFullCrm() || currentRole === 'ru';
    const showCnySamples = isFullCrm() || currentRole === 'cn';

    let amountHtml;
    if (showRub && c.amountRub != null) {
      amountHtml = `<div class="deal-amount">${Number(c.amountRub).toLocaleString(localeTag())} ₽</div>`;
    } else if (currentRole === 'cn') {
      amountHtml = `<div class="deal-amount hidden-amt">${escapeHtml(t('crm.rub_hidden'))}</div>`;
    } else if (c.amountCny != null && isFullCrm()) {
      amountHtml = `<div class="deal-amount">${fmtCny(c.amountCny)}</div>`;
    } else {
      amountHtml = `<div class="deal-amount">${escapeHtml(c.amount || '—')}</div>`;
    }

    let samplesHtml = '';
    if (showCnySamples) {
      const rows = (c.sampleExpenses || [])
        .map((e) => {
          const title = e.titleKey ? t(e.titleKey) : (e.title || '');
          return `<tr><td>${escapeHtml(title)}</td><td>${fmtCny(e.purchase_cny)}</td><td>${fmtCny(e.shipping_cny)}</td><td>${fmtCny((e.purchase_cny || 0) + (e.shipping_cny || 0))}</td></tr>`;
        })
        .join('');
      const tot = sampleExpenseTotals(c.sampleExpenses);
      samplesHtml = `
      <div class="card" style="margin-bottom:12px">
        <h2>${escapeHtml(t('crm.samples_title'))} <span class="hint-pill">¥ · CN</span></h2>
        ${
          rows
            ? `<table class="sample-exp-table"><thead><tr><th>${escapeHtml(t('crm.th.item'))}</th><th>${escapeHtml(t('crm.th.buy'))}</th><th>${escapeHtml(t('crm.th.ship'))}</th><th>${escapeHtml(t('crm.th.total'))}</th></tr></thead><tbody>${rows}</tbody></table>
               <div class="sample-exp-total">${tf('crm.samples_total', { p: fmtCny(tot.purchase), s: fmtCny(tot.shipping) })}<strong>${fmtCny(tot.total)}</strong></div>`
            : '<p style="margin:0;color:var(--muted);font-size:13px">' + escapeHtml(t('crm.samples_none')) + '</p>'
        }
      </div>`;
    } else if (currentRole === 'ru' && (c.sampleExpenses || []).length) {
      samplesHtml = `<div class="crm-hidden-note">${escapeHtml(t('crm.hide.samples_ru'))}</div>`;
    }

    let visNote = '';
    if (currentRole === 'ru') {
      visNote = `<div class="crm-hidden-note">${escapeHtml(t('crm.hide.ru'))}</div>`;
    } else if (currentRole === 'cn') {
      visNote = `<div class="crm-hidden-note">${escapeHtml(t('crm.hide.cn'))}</div>`;
    } else if (currentRole === 'director') {
      visNote = `<div class="crm-hidden-note" style="border-color:var(--teal)">${escapeHtml(t('crm.hide.dir'))}</div>`;
    }

    const historyHtml = (c.historyKeys || [])
      .map((hk, i) => {
        const icon = (c.historyIcons && c.historyIcons[i]) || '💬';
        return `<div class="tl-item"><div class="ticon">${icon}</div><div>${escapeHtml(t(hk))}</div></div>`;
      })
      .join('');

    det.innerHTML = `
      <div class="dhead">
        <div>
          <h2>${escapeHtml(crmName(c))} <span class="side-chip ${c.side}">${c.side}</span></h2>
          <div class="contacts">
            ${escapeHtml(crmContact(c))} ·
            <a href="tel:${c.phone}">${escapeHtml(c.phone)}</a> ·
            <a href="mailto:${c.email}">${escapeHtml(c.email)}</a>
          </div>
        </div>
        <span class="status ${c.status === 'new' ? 'new' : c.status === 'work' ? 'work' : 'closed'}">${escapeHtml(crmStatusLabel(c.status))}</span>
      </div>
      ${visNote}
      <div class="card" style="margin-bottom:12px">
        <h2>${escapeHtml(t('crm.history'))}</h2>
        <div class="timeline">
          ${historyHtml}
        </div>
      </div>
      <div class="card" style="margin-bottom:12px">
        <h2>${escapeHtml(t('crm.projects'))}</h2>
        <div class="tl-item"><div class="ticon">📄</div><div>${escapeHtml(crmProject(c))}</div></div>
        <div style="margin-top:10px;font-size:12px;color:var(--muted)">${escapeHtml(t('crm.deal_sum'))}</div>
        ${amountHtml}
      </div>
      ${samplesHtml}
      <div class="next-step">
        <span style="font-size:18px">⏰</span>
        <div><strong>${escapeHtml(t('crm.next'))}</strong><div style="color:var(--muted);font-size:13px">${escapeHtml(crmNext(c))}</div></div>
      </div>
    `;
  }

  // ——— Tenders / TV ———
  function renderTenders() {
    const grid = $('#tenders-grid');
    if (!grid) return;
    grid.innerHTML = TENDERS.map((item) => {
      const title = item.titleKey ? t(item.titleKey) : item.title;
      const meta = item.metaKey ? t(item.metaKey) : item.meta;
      return `<div class="simple-card">
        <h3>${escapeHtml(title)} ${item.hot ? '<span style="color:#fca5a5">●</span>' : ''}</h3>
        <p>${escapeHtml(meta)}</p>
      </div>`;
    }).join('');
  }

  let tvRefreshTimer = null;
  async function renderTv() {
    const box = $('#tv-stats');
    if (!box) return;
    const paint = (counts) => {
      const c = counts || {};
      box.innerHTML = [
        { n: String(c.found != null ? c.found : '—'), l: t('tv.found'), cls: 'ok' },
        { n: String(c.in_work != null ? c.in_work : '—'), l: t('tv.work'), cls: 'hot' },
        { n: String(c.application != null ? c.application : '—'), l: t('tv.apps'), cls: 'ok' },
        { n: String(c.won != null ? c.won : '—'), l: t('tv.won'), cls: 'ok' },
        { n: String(c.lost != null ? c.lost : '—'), l: t('tv.lost'), cls: 'hot' },
      ]
        .map(
          (s) =>
            `<div class="stat ${s.cls}"><div class="n">${s.n}</div><div class="l">${escapeHtml(s.l)}</div></div>`
        )
        .join('');
    };
    try {
      const res = await fetch('/api/tv', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && data.ok && data.counts) {
        paint(data.counts);
      } else {
        paint(null);
      }
    } catch (_) {
      paint(null);
    }
    if (tvRefreshTimer) clearInterval(tvRefreshTimer);
    tvRefreshTimer = setInterval(() => {
      if (typeof currentSection !== 'undefined' && currentSection === 'tv') renderTv();
    }, 45000);
  }

  // ——— Storage ———
  function renderStorage() {
    const pers = $('#personal-tree');
    if (!pers) return;
    pers.innerHTML = PERSONAL_PROJECTS.map((p) => {
      const chip =
        p.type === 'tender'
          ? '<span class="proj-chip tender">tender</span>'
          : '<span class="proj-chip order">client_order</span>';
      const title = p.titleKey ? t(p.titleKey) : p.title;
      const files = (p.fileKeys || p.files || [])
        .map((f) => {
          const name = typeof f === 'string' && f.indexOf('file.') === 0 ? t(f) : f;
          return `<div class="tree-file"><span class="file">📄</span> ${escapeHtml(name)}</div>`;
        })
        .join('');
      return `<div style="margin-bottom:10px">
        <div class="tree-folder-row"><span class="chev">▼</span><span class="folder">📁</span> ${escapeHtml(title)} ${chip}</div>
        <div class="tree-children">${files}</div>
      </div>`;
    }).join('');

    let html = '<div style="margin-bottom:12px"><div class="tree-folder-row" style="color:var(--muted-2);font-size:11px;text-transform:uppercase;letter-spacing:.05em">' +
      escapeHtml(t('storage.doc_types')) + '</div>';
    SHARED_DOC_FOLDER_KEYS.forEach((folderKey) => {
      const folderLabel = t(folderKey);
      const sample =
        folderKey === 'folder.kp_final'
          ? ['alpha_kp_final.pdf']
          : folderKey === 'folder.spec_after_kp'
            ? ['frunze_spec_after_kp.xlsx']
            : folderKey === 'folder.invoice'
              ? []
              : folderKey === 'folder.drawings'
                ? ['common_profiles.dwg']
                : [];
      const files = sample
        .map((f) => `<div class="tree-file"><span class="file">📄</span> ${escapeHtml(f)}</div>`)
        .join('');
      html += `<div class="tree-folder-row"><span class="chev">▶</span><span class="folder">📂</span> ${escapeHtml(folderLabel)}</div>`;
      if (files) html += `<div class="tree-children">${files}</div>`;
    });
    html += '</div>';

    html += '<div class="tree-folder-row" style="margin-top:8px"><span class="chev">▼</span><span class="folder">📁</span> tenders/</div><div class="tree-children">';
    SHARED_TENDERS.forEach((tend) => {
      html += `<div class="tree-folder-row"><span class="chev">▼</span><span class="folder">📁</span> ${escapeHtml(tend.no)}/</div><div class="tree-children">`;
      Object.keys(tend.files).forEach((folderKey) => {
        const folderLabel = t(folderKey);
        html += `<div class="tree-folder-row"><span class="chev">▶</span><span class="folder">📂</span> ${escapeHtml(folderLabel)}</div>`;
        (tend.files[folderKey] || []).forEach((f) => {
          html += `<div class="tree-file"><span class="file">📄</span> ${escapeHtml(f)}</div>`;
        });
      });
      SHARED_DOC_FOLDER_KEYS.forEach((folderKey) => {
        if (!(folderKey in tend.files)) {
          html += `<div class="tree-folder-row" style="opacity:.45"><span class="chev">▶</span><span class="folder">📂</span> ${escapeHtml(t(folderKey))} <span style="font-weight:400;color:var(--muted-2);font-size:11px">${escapeHtml(t('storage.empty'))}</span></div>`;
        }
      });
      html += '</div>';
    });
    html += '</div>';

    const shared = $('#shared-tree');
    if (shared) shared.innerHTML = html;
  }


  // ——— Mail ———
  let mailTab = 'in';
  let mailItems = [];
  let mailSelectedId = null;
  let mailPeriod = 'week';
  let mailAuthToken = null;

  // ——— SMTP allowlist (general_admin only) ———
  async function loadSmtpAllowlist() {
    const panel = $('#smtp-allowlist-panel');
    const listEl = $('#smtp-allowlist-list');
    const statusEl = $('#smtp-allowlist-status');
    if (!panel || !listEl) return;
    if (currentRole !== 'admin') {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const { status, data } = await mailApi('/api/mail/smtp-allowlist');
    if (status === 403) {
      panel.hidden = true;
      return;
    }
    if (status !== 200) {
      if (statusEl) statusEl.textContent = t('smtp.err').replace('{err}', (data && data.error) || status);
      return;
    }
    const items = (data && data.items) || [];
    if (!items.length) {
      listEl.innerHTML = '<div style="font-size:12px;color:var(--muted)">' + escapeHtml(t('smtp.empty')) + '</div>';
    } else {
      listEl.innerHTML = items
        .map((it) => {
          const act = it.active ? t('smtp.active') : t('smtp.inactive');
          const toggleLabel = it.active ? t('smtp.deactivate') : t('smtp.activate');
          return (
            '<div class="smtp-allow-row" data-id="' +
            it.id +
            '" style="display:flex;align-items:center;gap:8px;font-size:12.5px;flex-wrap:wrap">' +
            '<code style="flex:1;min-width:140px">' +
            escapeHtml(it.email) +
            '</code>' +
            '<span style="color:var(--muted)">' +
            escapeHtml(it.label || '') +
            '</span>' +
            '<span style="color:var(--muted)">' +
            escapeHtml(act) +
            '</span>' +
            '<button type="button" class="btn ghost smtp-toggle" data-id="' +
            it.id +
            '" data-active="' +
            (it.active ? '1' : '0') +
            '" style="padding:2px 8px">' +
            escapeHtml(toggleLabel) +
            '</button>' +
            '<button type="button" class="btn ghost smtp-del" data-id="' +
            it.id +
            '" style="padding:2px 8px">' +
            escapeHtml(t('smtp.remove')) +
            '</button>' +
            '</div>'
          );
        })
        .join('');
      listEl.querySelectorAll('.smtp-del').forEach((b) => {
        b.addEventListener('click', async () => {
          const id = b.getAttribute('data-id');
          const r = await mailApi('/api/mail/smtp-allowlist/' + id, { method: 'DELETE' });
          if (r.status >= 400) {
            if (statusEl) statusEl.textContent = t('smtp.err').replace('{err}', (r.data && r.data.error) || r.status);
            return;
          }
          if (statusEl) statusEl.textContent = t('smtp.saved');
          loadSmtpAllowlist();
        });
      });
      listEl.querySelectorAll('.smtp-toggle').forEach((b) => {
        b.addEventListener('click', async () => {
          const id = b.getAttribute('data-id');
          const cur = b.getAttribute('data-active') === '1';
          const r = await mailApi('/api/mail/smtp-allowlist/' + id, {
            method: 'PATCH',
            body: { active: !cur },
          });
          if (r.status >= 400) {
            if (statusEl) statusEl.textContent = t('smtp.err').replace('{err}', (r.data && r.data.error) || r.status);
            return;
          }
          if (statusEl) statusEl.textContent = t('smtp.saved');
          loadSmtpAllowlist();
        });
      });
    }
    if (statusEl && status === 200) {
      statusEl.textContent = data.enforce ? 'SMTP_ALLOWLIST_ENFORCE=1' : '';
    }
  }

  function bindSmtpAllowlistForm() {
    const form = $('#smtp-allowlist-form');
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (currentRole !== 'admin') {
        toast(t('toast.admin_only'));
        return;
      }
      const email = ($('#smtp-allowlist-email') || {}).value || '';
      const label = ($('#smtp-allowlist-label') || {}).value || '';
      const statusEl = $('#smtp-allowlist-status');
      const r = await mailApi('/api/mail/smtp-allowlist', {
        method: 'POST',
        body: { email, label },
      });
      if (r.status >= 400) {
        if (statusEl) statusEl.textContent = t('smtp.err').replace('{err}', (r.data && r.data.error) || r.status);
        return;
      }
      if ($('#smtp-allowlist-email')) $('#smtp-allowlist-email').value = '';
      if ($('#smtp-allowlist-label')) $('#smtp-allowlist-label').value = '';
      if (statusEl) statusEl.textContent = t('smtp.saved');
      loadSmtpAllowlist();
    });
  }

  function mailToken() {
    return getToken();
  }

  async function mailApi(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const tok = mailToken();
    if (tok) headers.Authorization = 'Bearer ' + tok;
    const res = await fetch(path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  function isMailStatsRole() {
    return currentRole === 'admin' || currentRole === 'director';
  }

  function applyMailRoleUI() {
    const pill = $('#pill-mail-stats');
    if (pill) {
      pill.dataset.roleHidden = isMailStatsRole() ? '0' : '1';
      pill.hidden = !isMailStatsRole();
    }
    if (!isMailStatsRole() && currentSection === 'mail-stats') setSection('mail');
  }

  /** Журнал активности — только general_admin (демо-роль admin). */
  function isActivityJournalRole() {
    return currentRole === 'admin';
  }

  function applyActivityRoleUI() {
    const pill = $('#pill-activity');
    if (pill) {
      pill.dataset.roleHidden = isActivityJournalRole() ? '0' : '1';
      pill.hidden = !isActivityJournalRole();
    }
    if (!isActivityJournalRole() && currentSection === 'activity') openTeamChats('projects');
  }

  async function loadMail() {
    const dir = mailTab === 'out' ? 'out' : 'in';
    const q =
      mailTab === 'waiting'
        ? '/api/mail/messages?direction=in&status=waiting_manager'
        : '/api/mail/messages?direction=' + dir;
    const r = await mailApi(q);
    if (r.status !== 200) {
      mailItems = [];
      renderMailListDemoFallback();
      return;
    }
    mailItems = r.data.items || [];
    if (mailTab === 'waiting') {
      mailItems = mailItems.filter(
        (m) => m.status === 'waiting_manager' || m.status === 'escalated'
      );
    }
    renderMailList();
    const n = await mailApi('/api/mail/notifications?unread=1');
    renderMailNotifs(n.status === 200 ? n.data.items || [] : []);
    const cfg = await mailApi('/api/mail/config');
    const lab = $('#mail-mode-label');
    if (lab && cfg.data && cfg.data.config) {
      const c = cfg.data.config;
      lab.textContent =
        'sync: ' + c.sync_mode + ' · smtp: ' + c.smtp_mode + ' · AI: ' + c.ai_mode;
    }
  }

  function renderMailListDemoFallback() {
    const box = $('#mail-list');
    if (!box) return;
    box.innerHTML =
      '<div class="empty" style="padding:20px;color:var(--muted)">' + escapeHtml(t('mail.no_token')) + '</div>';
  }

  function statusClass(st) {
    if (st === 'waiting_manager' || st === 'drafted') return 'wait';
    if (st === 'escalated') return 'escalated';
    return '';
  }

  function renderMailList() {
    const box = $('#mail-list');
    if (!box) return;
    if (!mailItems.length) {
      box.innerHTML = '<div class="empty" style="padding:16px;color:var(--muted)">' + escapeHtml(t('mail.empty')) + '</div>';
      return;
    }
    box.innerHTML = mailItems
      .map((m) => {
        const draft = m.draft;
        const meta = [
          m.client_name || m.from_addr || '',
          m.crm_side || '',
          m.received_at || m.sent_at || '',
          draft ? t('mail.draft') + draft.status : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return `<button type="button" class="mail-row" data-mid="${m.id}">
          <div>
            <div class="msub">${escapeHtml(m.subject || t('mail.no_subject'))}</div>
            <div class="mmeta">${escapeHtml(meta)}</div>
          </div>
          <span class="mstatus ${statusClass(m.status)}">${escapeHtml(m.status || '')}</span>
        </button>`;
      })
      .join('');
    box.querySelectorAll('.mail-row').forEach((el) => {
      el.addEventListener('click', () => openMailDetail(Number(el.getAttribute('data-mid'))));
    });
    const badge = $('#pill-mail-badge');
    const waiting = mailItems.filter(
      (m) => m.direction === 'in' && (m.status === 'waiting_manager' || m.status === 'escalated')
    ).length;
    if (badge) {
      if (waiting) {
        badge.hidden = false;
        badge.textContent = String(waiting);
      } else badge.hidden = true;
    }
  }

  function renderMailNotifs(items) {
    const strip = $('#mail-notif-strip');
    if (!strip) return;
    if (!items.length) {
      strip.innerHTML = '';
      return;
    }
    strip.innerHTML = items
      .slice(0, 3)
      .map(
        (n) =>
          `<div class="mail-notif"><strong>${escapeHtml(n.title)}</strong>${escapeHtml(
            n.body || ''
          )}</div>`
      )
      .join('');
  }

  async function openMailDetail(id) {
    mailSelectedId = id;
    const r = await mailApi('/api/mail/messages/' + id);
    const det = $('#mail-detail');
    if (!det) return;
    if (r.status !== 200) {
      det.classList.remove('hidden');
      det.innerHTML = '<p>Не удалось загрузить письмо</p>';
      return;
    }
    const m = r.data.message;
    const d = m.draft;
    const analysis = m.analysis || {};
    let draftHtml = '';
    if (d && (d.status === 'pending' || d.status === 'edited')) {
      draftHtml = `
        <div class="mail-draft-box">
          <h4 style="margin:12px 0 6px">Черновик бота ${d.edited ? '(правили)' : '(без правок)'}</h4>
          <input id="mail-draft-subj" value="${escapeHtml(d.subject || '')}" style="width:100%;margin-bottom:8px;padding:8px;border-radius:8px;border:1px solid #334155;background:#0b1018;color:inherit" />
          <div class="mail-dictation-row"><button type="button" class="btn ghost" id="btn-mail-dictate" data-i18n="chats.dictation_mail">🎤</button></div>
          <textarea id="mail-draft-body">${escapeHtml(d.body_text || '')}</textarea>
          <div class="mail-draft-actions">
            <button type="button" class="btn primary" id="btn-mail-send">Отправить</button>
            <button type="button" class="btn ghost" id="btn-mail-reject">Отклонить</button>
            <button type="button" class="btn ghost" id="btn-mail-cmd-reply">Команда: ответь</button>
            <button type="button" class="btn ghost" id="btn-mail-cmd-dir">Перенаправь директору</button>
          </div>
        </div>`;
    } else if (d) {
      draftHtml = `<p style="color:var(--muted);font-size:12px">Черновик: ${escapeHtml(d.status)}</p>`;
    }
    det.classList.remove('hidden');
    det.innerHTML = `
      <h3>${escapeHtml(m.subject || '')}</h3>
      <div class="mmeta" style="color:var(--muted);font-size:12px;margin-bottom:8px">
        ${escapeHtml(m.from_addr || '')} → ${escapeHtml(m.to_addr || '')}<br/>
        клиент: ${escapeHtml(m.client_name || '—')} · проект #${m.project_id || '—'} · ${escapeHtml(m.crm_side || '')}<br/>
        анализ: ${escapeHtml((analysis.topic || '') + ' · ждут: ' + (analysis.expect || ''))}
      </div>
      <div class="mail-body">${escapeHtml(m.body_text || '')}</div>
      ${draftHtml}`;
    const send = $('#btn-mail-send');
    const rej = $('#btn-mail-reject');
    const cmdR = $('#btn-mail-cmd-reply');
    const cmdD = $('#btn-mail-cmd-dir');
    if (send && d) {
      send.addEventListener('click', async () => {
        const body = {
          subject: ($('#mail-draft-subj') || {}).value,
          body_text: ($('#mail-draft-body') || {}).value,
        };
        const out = await mailApi('/api/mail/drafts/' + d.id + '/approve', { method: 'POST', body });
        toast(out.status === 200 ? t('toast.mail_sent') : tf('toast.mail_err', { err: out.data.error || out.status }));
        loadMail();
        openMailDetail(id);
      });
    }
    if (rej && d) {
      rej.addEventListener('click', async () => {
        await mailApi('/api/mail/drafts/' + d.id + '/reject', {
          method: 'POST',
          body: { note: 'менеджер пишет сам' },
        });
        toast(t('toast.draft_rej'));
        loadMail();
      });
    }
    if (cmdR && d) {
      cmdR.addEventListener('click', async () => {
        const out = await mailApi('/api/mail/drafts/' + d.id + '/command', {
          method: 'POST',
          body: { command: 'ответь' },
        });
        toast(out.status === 200 ? t('toast.cmd_ok') : t('toast.cmd_err'));
        loadMail();
      });
    }
    if (cmdD && d) {
      cmdD.addEventListener('click', async () => {
        const out = await mailApi('/api/mail/drafts/' + d.id + '/command', {
          method: 'POST',
          body: { command: 'перенаправь директору' },
        });
        toast(out.status === 200 ? t('toast.esc_ok') : t('toast.esc_err'));
        loadMail();
      });
    }
    const dictBtn = $('#btn-mail-dictate');
    if (dictBtn) {
      dictBtn.addEventListener('click', () => startDictationInto($('#mail-draft-body')));
    }
  }

  async function renderMail() {
    applyMailRoleUI();
    await loadMail();
  }

  async function renderMailStats() {
    if (!isMailStatsRole()) {
      toast(t('toast.mail_stats_deny'));
      setSection('mail');
      return;
    }
    const r = await mailApi('/api/mail/stats?period=' + mailPeriod);
    const metrics = $('#mail-stats-metrics');
    const mgr = $('#mail-stats-managers');
    const proj = $('#mail-stats-projects');
    const chart = $('#mail-stats-chart');
    if (r.status !== 200) {
      if (metrics) metrics.innerHTML = '<p style="color:var(--muted)">' + escapeHtml(t('mail.no_access')) + '</p>';
      return;
    }
    const m = r.data.metrics || {};
    if (metrics) {
      metrics.innerHTML = [
        ['Входящие', m.inbound],
        ['Исходящие', m.outbound],
        ['Бот без правок', m.bot_sent_unedited],
        ['Ручная обработка', m.manual_handled],
        ['Ср. ответ, ч', m.avg_response_hours != null ? m.avg_response_hours : '—'],
      ]
        .map(
          ([l, n]) =>
            `<div class="mail-metric"><div class="n">${escapeHtml(String(n))}</div><div class="l">${escapeHtml(
              l
            )}</div></div>`
        )
        .join('');
    }
    function table(rows, cols) {
      if (!rows || !rows.length) return '<p style="color:var(--muted);font-size:12px">нет данных</p>';
      let h = '<table class="mail-table"><thead><tr>' + cols.map((c) => '<th>' + c[1] + '</th>').join('') + '</tr></thead><tbody>';
      rows.forEach((row) => {
        h +=
          '<tr>' +
          cols
            .map((c) => '<td>' + escapeHtml(String(row[c[0]] != null ? row[c[0]] : '—')) + '</td>')
            .join('') +
          '</tr>';
      });
      return h + '</tbody></table>';
    }
    if (mgr) {
      mgr.innerHTML = table(r.data.by_manager, [
        ['display_name', t('mail.manager_col')],
        ['role', 'Роль'],
        ['sent', 'Отпр.'],
        ['edited', 'Правили'],
        ['rejected', 'Откл.'],
        ['avg_hours', 'Ср.ч'],
      ]);
    }
    if (proj) {
      proj.innerHTML = table(r.data.by_project, [
        ['client_name', 'Клиент'],
        ['title', 'Проект'],
        ['inbound', 'In'],
        ['outbound', 'Out'],
        ['open_items', 'Открыто'],
      ]);
    }
    if (chart) {
      const series = r.data.series || [];
      const max = Math.max(1, ...series.map((s) => (s.inbound || 0) + (s.outbound || 0)));
      chart.innerHTML = series
        .map((s) => {
          const hi = Math.round(((s.inbound || 0) / max) * 100);
          const ho = Math.round(((s.outbound || 0) / max) * 100);
          return `<div class="mail-bar" style="height:100%"><div class="in" style="height:${hi}%"></div><div class="out" style="height:${ho}%"></div><span class="lab">${escapeHtml(
            (s.day || '').slice(5)
          )}</span></div>`;
        })
        .join('');
    }
  }



  // ——— Personal section (full work area; opened from userchip) ———
  function isProfileCardOpen() {
    return currentSection === 'personal';
  }

  function syncUserchipPersonalState(open) {
    const btn = document.getElementById('userchip');
    if (!btn) return;
    btn.setAttribute('aria-pressed', open ? 'true' : 'false');
    btn.classList.toggle('is-personal-open', !!open);
  }

  function openProfileCard(forceOpen) {
    const open = typeof forceOpen === 'boolean' ? forceOpen : true;
    if (open) {
      if (typeof toggleThemePopover === 'function') toggleThemePopover(false);
      if (typeof toggleNotifPanel === 'function') toggleNotifPanel(false);
      setSection('personal');
      return;
    }
    // forceOpen === false: no popup to dismiss; leave current section alone
    // (theme/notif popovers used to close the old profile card).
  }

  function toggleProfileCard(force) {
    const currentlyOpen = currentSection === 'personal';
    if (typeof force === 'boolean') {
      if (force) openProfileCard(true);
      else if (currentlyOpen) setSection('chats');
      return;
    }
    if (currentlyOpen) setSection('chats');
    else openProfileCard(true);
  }


  // ——— Calendar (localStorage) ———
  const CAL_EVENTS_KEY = 'gilil_calendar_events';
  let calViewYear = new Date().getFullYear();
  let calViewMonth = new Date().getMonth(); // 0-11
  let calSelectedDate = null; // YYYY-MM-DD
  let calEvents = [];
  let calBound = false;

  function loadCalEvents() {
    try {
      const raw = localStorage.getItem(CAL_EVENTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      calEvents = Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      calEvents = [];
    }
  }

  function saveCalEvents() {
    try {
      localStorage.setItem(CAL_EVENTS_KEY, JSON.stringify(calEvents));
    } catch (_) {}
  }

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function parseYmd(s) {
    const p = String(s || '').split('-');
    if (p.length !== 3) return null;
    const y = +p[0], m = +p[1], d = +p[2];
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function calMonthNames() {
    const raw = t('cal.months') || '';
    const parts = raw.split(',').map((x) => x.trim()).filter(Boolean);
    if (parts.length === 12) return parts;
    return ['January','February','March','April','May','June','July','August','September','October','November','December'];
  }

  function eventsForDate(dateStr) {
    return calEvents
      .filter((e) => e && e.date === dateStr)
      .slice()
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  }

  function eventsForDayFromTasks(dateStr) {
    // Also surface tasks with due date matching selected day
    const out = [];
    try {
      (tasks || []).forEach((task) => {
        if (!task || task.done) return;
        const ts = task.dueAt || null;
        if (!ts) return;
        const d = new Date(ts);
        if (ymd(d) !== dateStr) return;
        out.push({
          id: 'task:' + task.id,
          kind: 'task',
          title: typeof taskTitle === 'function' ? taskTitle(task) : (task.title || task.id),
          date: dateStr,
          time: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'),
          taskId: task.id,
          projectId: null,
        });
      });
    } catch (_) {}
    return out;
  }

  function renderCalendar() {
    loadCalEvents();
    const title = $('#cal-month-title');
    const grid = $('#cal-grid');
    const weekdays = $('#cal-weekdays');
    if (!grid) return;
    const months = calMonthNames();
    if (title) title.textContent = months[calViewMonth] + ' ' + calViewYear;

    if (weekdays && !weekdays.dataset.ready) {
      weekdays.innerHTML = [0,1,2,3,4,5,6].map((i) =>
        '<div class="cal-wd">' + escapeHtml(t('cal.weekday.' + i)) + '</div>'
      ).join('');
      weekdays.dataset.ready = '1';
    } else if (weekdays) {
      weekdays.innerHTML = [0,1,2,3,4,5,6].map((i) =>
        '<div class="cal-wd">' + escapeHtml(t('cal.weekday.' + i)) + '</div>'
      ).join('');
    }

    const first = new Date(calViewYear, calViewMonth, 1);
    // Monday-first: getDay() Sun=0 → convert
    let startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    const todayStr = ymd(new Date());
    if (!calSelectedDate) calSelectedDate = todayStr;

    const cells = [];
    for (let i = 0; i < startPad; i++) {
      cells.push('<div class="cal-cell cal-empty" aria-hidden="true"></div>');
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = ymd(new Date(calViewYear, calViewMonth, day));
      const nEv = eventsForDate(ds).length + eventsForDayFromTasks(ds).length;
      const cls = [
        'cal-cell',
        ds === todayStr ? 'cal-today' : '',
        ds === calSelectedDate ? 'cal-selected' : '',
        nEv ? 'cal-has-events' : '',
      ].filter(Boolean).join(' ');
      cells.push(
        '<button type="button" class="' + cls + '" data-cal-date="' + ds + '" aria-pressed="' +
        (ds === calSelectedDate ? 'true' : 'false') + '">' +
        '<span class="cal-day-num">' + day + '</span>' +
        (nEv ? '<span class="cal-dot" title="' + nEv + '"></span>' : '') +
        '</button>'
      );
    }
    grid.innerHTML = cells.join('');
    grid.querySelectorAll('[data-cal-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        calSelectedDate = btn.getAttribute('data-cal-date');
        renderCalendar();
      });
    });
    renderCalDayPanel();
  }

  function projectLabelById(id) {
    if (!id) return '';
    const p = (typeof PERSONAL_PROJECTS !== 'undefined' ? PERSONAL_PROJECTS : []).find((x) => x.id === id);
    if (!p) return id;
    return p.titleKey ? t(p.titleKey) : (p.title || id);
  }

  function renderCalDayPanel() {
    const title = $('#cal-day-title');
    const list = $('#cal-day-list');
    const empty = $('#cal-day-empty');
    if (!list) return;
    const ds = calSelectedDate || ymd(new Date());
    const d = parseYmd(ds);
    if (title) {
      if (d) {
        const months = calMonthNames();
        title.textContent = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
      } else {
        title.textContent = ds;
      }
    }
    const items = eventsForDate(ds).concat(eventsForDayFromTasks(ds));
    items.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    list.innerHTML = items.map((ev) => {
      const linkBits = [];
      if (ev.projectId) linkBits.push(escapeHtml(t('cal.link_project')) + ': ' + escapeHtml(projectLabelById(ev.projectId)));
      if (ev.taskId && ev.kind !== 'task') {
        const task = (tasks || []).find((x) => x.id === ev.taskId);
        const tn = task ? (typeof taskTitle === 'function' ? taskTitle(task) : task.title) : ev.taskId;
        linkBits.push(escapeHtml(t('cal.link_task')) + ': ' + escapeHtml(tn));
      }
      if (ev.kind === 'task') linkBits.push(escapeHtml(t('cal.link_task')));
      const delBtn = ev.kind === 'task'
        ? ''
        : '<button type="button" class="btn ghost cal-ev-del" data-cal-del="' + escapeHtml(ev.id) + '">' + escapeHtml(t('cal.delete')) + '</button>';
      const openAttr = ev.kind === 'task' && ev.taskId
        ? ' data-cal-open-task="' + escapeHtml(ev.taskId) + '" style="cursor:pointer"'
        : (ev.taskId ? ' data-cal-open-task="' + escapeHtml(ev.taskId) + '" style="cursor:pointer"' : '');
      return '<div class="cal-ev-row" data-cal-ev="' + escapeHtml(ev.id) + '"' + openAttr + '>' +
        '<div class="cal-ev-time">' + escapeHtml(ev.time || '—') + '</div>' +
        '<div class="cal-ev-body">' +
          '<div class="cal-ev-title">' + escapeHtml(ev.title || '') + '</div>' +
          (linkBits.length ? '<div class="cal-ev-meta">' + linkBits.join(' · ') + '</div>' : '') +
        '</div>' +
        delBtn +
      '</div>';
    }).join('');
    list.querySelectorAll('[data-cal-del]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-cal-del');
        calEvents = calEvents.filter((x) => x.id !== id);
        saveCalEvents();
        toast(t('cal.deleted'));
        renderCalendar();
      });
    });
    list.querySelectorAll('[data-cal-open-task]').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('[data-cal-del]')) return;
        const tid = row.getAttribute('data-cal-open-task');
        if (tid && typeof openTaskModal === 'function') openTaskModal(tid);
      });
    });
  }

  function fillCalLinkSelects() {
    const projSel = $('#cal-ev-project');
    const taskSel = $('#cal-ev-task');
    if (projSel) {
      const opts = ['<option value="">—</option>'].concat(
        (typeof PERSONAL_PROJECTS !== 'undefined' ? PERSONAL_PROJECTS : []).map((p) => {
          const lab = p.titleKey ? t(p.titleKey) : (p.title || p.id);
          return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(lab) + '</option>';
        })
      );
      projSel.innerHTML = opts.join('');
    }
    if (taskSel) {
      const opts = ['<option value="">—</option>'].concat(
        (tasks || []).filter((x) => !x.done).map((task) => {
          const lab = typeof taskTitle === 'function' ? taskTitle(task) : (task.title || task.id);
          return '<option value="' + escapeHtml(task.id) + '">' + escapeHtml(lab) + '</option>';
        })
      );
      taskSel.innerHTML = opts.join('');
    }
  }

  function openCalEventModal(presetDate) {
    fillCalLinkSelects();
    const modal = $('#cal-event-modal');
    if (!modal) return;
    const ds = presetDate || calSelectedDate || ymd(new Date());
    const titleEl = $('#cal-ev-title');
    const dateEl = $('#cal-ev-date');
    const timeEl = $('#cal-ev-time');
    if (titleEl) titleEl.value = '';
    if (dateEl) dateEl.value = ds;
    if (timeEl) {
      const now = new Date();
      timeEl.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
    const proj = $('#cal-ev-project');
    const task = $('#cal-ev-task');
    if (proj) proj.value = '';
    if (task) task.value = '';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (titleEl) titleEl.focus();
  }

  function closeCalEventModal() {
    const modal = $('#cal-event-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function submitCalEvent() {
    const titleEl = $('#cal-ev-title');
    const dateEl = $('#cal-ev-date');
    const timeEl = $('#cal-ev-time');
    const proj = $('#cal-ev-project');
    const task = $('#cal-ev-task');
    const title = String((titleEl && titleEl.value) || '').trim();
    const date = String((dateEl && dateEl.value) || '').trim();
    const time = String((timeEl && timeEl.value) || '').trim();
    if (!title || !date) {
      toast(t('cal.modal_hint'));
      return;
    }
    const ev = {
      id: 'cev' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      date,
      time: time || '09:00',
      projectId: (proj && proj.value) || null,
      taskId: (task && task.value) || null,
      createdAt: Date.now(),
    };
    loadCalEvents();
    calEvents.push(ev);
    saveCalEvents();
    calSelectedDate = date;
    const pd = parseYmd(date);
    if (pd) {
      calViewYear = pd.getFullYear();
      calViewMonth = pd.getMonth();
    }
    closeCalEventModal();
    toast(t('cal.added'));
    renderCalendar();
  }

  function bindCalendarUI() {
    if (calBound) return;
    calBound = true;
    loadCalEvents();
    const addBtn = $('#btn-cal-add');
    if (addBtn) addBtn.addEventListener('click', () => openCalEventModal(calSelectedDate));
    const prev = $('#btn-cal-prev');
    if (prev) prev.addEventListener('click', () => {
      calViewMonth -= 1;
      if (calViewMonth < 0) { calViewMonth = 11; calViewYear -= 1; }
      renderCalendar();
    });
    const next = $('#btn-cal-next');
    if (next) next.addEventListener('click', () => {
      calViewMonth += 1;
      if (calViewMonth > 11) { calViewMonth = 0; calViewYear += 1; }
      renderCalendar();
    });
    const todayBtn = $('#btn-cal-today');
    if (todayBtn) todayBtn.addEventListener('click', () => {
      const now = new Date();
      calViewYear = now.getFullYear();
      calViewMonth = now.getMonth();
      calSelectedDate = ymd(now);
      renderCalendar();
    });
    const closeBtn = $('#cal-ev-close');
    if (closeBtn) closeBtn.addEventListener('click', closeCalEventModal);
    const cancelBtn = $('#cal-ev-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeCalEventModal);
    const submitBtn = $('#cal-ev-submit');
    if (submitBtn) submitBtn.addEventListener('click', submitCalEvent);
    const modal = $('#cal-event-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCalEventModal();
      });
    }
  }


  // ——— One-tier nav (single pills row) ———
  let chatGroupFilter = null; // 'ru' | 'cn' | 'projects' | 'director' | null

  function syncPillsActive(section) {
    const onChats = section === 'chats';
    $$('#pills .pill').forEach((p) => {
      const team = p.getAttribute('data-team');
      const sec = p.getAttribute('data-section');
      if (team) {
        p.classList.toggle('active', onChats && chatGroupFilter === team);
      } else if (sec) {
        p.classList.toggle('active', !onChats && sec === section);
      }
    });
  }

  function openTeamChats(team) {
    chatGroupFilter = team || 'ru';
    if (typeof renderChats === 'function') renderChats();
    setSection('chats');
  }

  // ——— Sections ———
  function setSection(name, opts) {
    opts = opts || {};
    currentSection = name;
    if (name !== 'chats') {
      chatGroupFilter = null;
    }
    // RU/CN no longer top pills — keep existing projects filter or show by visibility dropdown
    syncPillsActive(name);
    syncUserchipPersonalState(name === 'personal');
    $$('.section').forEach((s) => {
      s.classList.toggle('active', s.id === 'sec-' + name);
    });
    if (name === 'personal') {
      if (typeof loadMyUsefulnessProfile === 'function') loadMyUsefulnessProfile();
      if (typeof renderPlan === 'function') renderPlan();
      if (typeof renderTasks === 'function') renderTasks();
    }
    if (name === 'tasks-plans') {
      if (typeof renderTasksPlans === 'function') renderTasksPlans();
    }
    if (name === 'calendar') {
      if (typeof renderCalendar === 'function') renderCalendar();
    }
    if (name === 'crm') renderCrm();
    if (name === 'leads') loadAndRenderLeads();
    if (name === 'tenders') renderTenders();
    if (name === 'tv') renderTv();
    if (name === 'news') {
      // Re-push theme into news iframe (lazy load / already mounted).
      if (typeof pushThemeToFrames === 'function') pushThemeToFrames(currentTheme);
    }
    if (name === 'storage') renderStorage();
    if (name === 'supply') {
      if (window.GililSupplyStage2 && typeof window.GililSupplyStage2.ensure === 'function') {
        window.GililSupplyStage2.ensure();
      }
    }
    if (name === 'chats' && selectedChat) openChatThread(selectedChat);
    if (name === 'mail') renderMail();
    if (name === 'mail-stats') renderMailStats();
    if (name === 'funnel') loadFunnelPanel();
    if (name === 'activity') {
      if (!isActivityJournalRole()) { openTeamChats('projects'); return; }
      loadActivityPanel();
    }
    if (name === 'usefulness') loadUsefulnessPanel();
    if (name === 'director') {
      if (typeof loadDirectorWorkload === 'function') loadDirectorWorkload();
    }
  }


  // ——— OTP email login ———
  let otpResendLeft = 0;
  let otpResendTimer = null;
  let otpEmailPending = '';

  function setOtpStatus(msg, kind) {
    const el = $('#otp-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-error', kind === 'error');
    el.classList.toggle('is-ok', kind === 'ok');
  }

  function mapServerUserToRole(user) {
    if (!user) return 'ru';
    if (user.role === 'general_admin') return 'admin';
    if (user.role === 'director' && user.region === 'CN') return 'cn';
    if (user.role === 'director') return 'director';
    if (user.region === 'CN') return 'cn';
    return 'ru';
  }

  const AUTH_STORAGE_KEYS = [
    'gilil_token',
    'gilil_access_token',
    'gilil_refresh_token',
    'gilil_auth_user',
  ];

  function isRememberMe() {
    const el = document.getElementById('remember-me');
    return !!(el && el.checked);
  }

  function currentAuthRemembered() {
    try {
      return !!(
        localStorage.getItem('gilil_token') ||
        localStorage.getItem('gilil_access_token') ||
        localStorage.getItem('gilil_refresh_token')
      );
    } catch (_) {
      return false;
    }
  }

  function clearAuthLocalStorage() {
    AUTH_STORAGE_KEYS.forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  }

  function clearAuthSessionStorage() {
    AUTH_STORAGE_KEYS.forEach((k) => {
      try { sessionStorage.removeItem(k); } catch (_) {}
    });
  }

  /** sessionStorage first, then localStorage (remember-me). */
  function getToken() {
    try {
      return (
        sessionStorage.getItem('gilil_access_token') ||
        sessionStorage.getItem('gilil_token') ||
        localStorage.getItem('gilil_access_token') ||
        localStorage.getItem('gilil_token') ||
        null
      );
    } catch (_) {
      return null;
    }
  }

  function getAuthUser() {
    try {
      const raw =
        sessionStorage.getItem('gilil_auth_user') ||
        localStorage.getItem('gilil_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function storeAuthTokens(data, remember) {
    if (!data) return;
    if (remember == null) remember = isRememberMe();
    const store = remember ? localStorage : sessionStorage;
    try {
      if (!remember) clearAuthLocalStorage();
      else clearAuthSessionStorage();
      if (data.token) store.setItem('gilil_token', data.token);
      if (data.access_token) store.setItem('gilil_access_token', data.access_token);
      if (data.refresh_token) store.setItem('gilil_refresh_token', data.refresh_token);
      if (data.user) store.setItem('gilil_auth_user', JSON.stringify(data.user));
    } catch (_) {}
  }

  function openShellAfterAuth(opts) {
    opts = opts || {};
    try {
      sessionStorage.setItem('gilil_shell_v2_demo', opts.sessionKey || 'otp');
      if (opts.demoUser) localStorage.setItem('gilil_demo_user', JSON.stringify(opts.demoUser));
    } catch (_) {}
    $('#login-gate').classList.add('hidden');
    $('#app-shell').classList.remove('hidden');
    $('#fab-tasks').classList.remove('hidden');
    renderChats();
    renderPlan();
    renderTasks();
    renderCrm();
    loadAndRenderLeads();
    renderTenders();
    renderTv();
    renderStorage();
    applyMailRoleUI();
    applyActivityRoleUI();
    openTeamChats('projects');
    applyRoleUI();
    applyLang(currentLang, { silent: true });
    toast(opts.toast || tf('toast.entered', { login: DEMO_USER().login, short: DEMO_USER().short, role: DEMO_USER().role }));
    setTimeout(() => {
      if (!beepPlayed && overdueCount() > 0) {
        beepPlayed = true;
        playBeep();
      }
      updateInvoiceAlert();
      loadNotifications();
      connectNotifWs();
      if (typeof loadServerTasks === 'function') loadServerTasks();
      if (typeof loadReplyStatuses === 'function') loadReplyStatuses();
    }, 1800);
  }

  function startOtpResendCountdown(sec) {
    otpResendLeft = Math.max(0, Number(sec) || 60);
    const btn = $('#btn-otp-resend');
    const timerEl = $('#otp-resend-timer');
    if (otpResendTimer) clearInterval(otpResendTimer);
    function tick() {
      if (btn) btn.disabled = otpResendLeft > 0;
      if (timerEl) {
        timerEl.textContent = otpResendLeft > 0 ? ' (' + otpResendLeft + 's)' : '';
      }
      if (otpResendLeft <= 0) {
        if (otpResendTimer) clearInterval(otpResendTimer);
        otpResendTimer = null;
        return;
      }
      otpResendLeft -= 1;
    }
    tick();
    otpResendTimer = setInterval(tick, 1000);
  }

  async function requestOtpCode() {
    const emailEl = $('#otp-email');
    const email = (emailEl && emailEl.value || '').trim();
    if (!email) {
      setOtpStatus(t('login.email'), 'error');
      if (emailEl) emailEl.focus();
      return;
    }
    const sendBtn = $('#btn-otp-send');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = t('login.sending'); }
    setOtpStatus('');
    const mockHint = $('#otp-mock-hint');
    if (mockHint) { mockHint.classList.add('hidden'); mockHint.textContent = ''; }
    try {
      const r = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 429 && data.retry_after_sec) {
          startOtpResendCountdown(data.retry_after_sec);
          setOtpStatus(tf('login.wait_resend', { sec: data.retry_after_sec }), 'error');
        } else {
          setOtpStatus(data.error || t('login.bad_code'), 'error');
        }
        return;
      }
      otpEmailPending = email;
      const block = $('#otp-code-block');
      if (block) block.classList.remove('hidden');
      startOtpResendCountdown(data.resend_after_sec || 60);
      setOtpStatus(t('login.code_sent'), 'ok');
      if (data.mock && data.code) {
        if (mockHint) {
          mockHint.classList.remove('hidden');
          mockHint.textContent = t('login.code_sent_mock') + ': ' + data.code;
        }
        const codeEl = $('#otp-code');
        if (codeEl && !codeEl.value) codeEl.value = data.code;
      }
      const codeEl = $('#otp-code');
      if (codeEl) codeEl.focus();
    } catch (e) {
      setOtpStatus(String(e.message || e), 'error');
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = t('login.send_code');
        sendBtn.setAttribute('data-i18n', 'login.send_code');
      }
    }
  }

  async function verifyOtpCode() {
    const email = otpEmailPending || (($('#otp-email') && $('#otp-email').value) || '').trim();
    const code = (($('#otp-code') && $('#otp-code').value) || '').trim();
    if (!email || !/^\d{6}$/.test(code)) {
      setOtpStatus(t('login.enter_code'), 'error');
      return;
    }
    const btn = $('#btn-otp-verify');
    if (btn) { btn.disabled = true; btn.textContent = t('login.verifying'); }
    setOtpStatus('');
    try {
      const rememberMe = isRememberMe();
      const r = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, rememberMe: !!rememberMe }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setOtpStatus(
          (data.error === 'invalid_code' ? t('login.bad_code') : (data.error || t('login.bad_code'))) +
            (data.attempts_left != null ? ' (' + data.attempts_left + ')' : ''),
          'error'
        );
        return;
      }
      storeAuthTokens(data, rememberMe);
      const role = mapServerUserToRole(data.user);
      currentRole = role;
      // Overlay display from server user when possible
      const u = DEMO_USER();
      if (data.user) {
        u.username = data.user.username;
        u.name = data.user.display_name || u.name;
        u.short = (data.user.display_name || u.short).split('·')[0].trim() || u.short;
        u.login = data.user.username;
      }
      openShellAfterAuth({
        sessionKey: 'otp:' + (data.user && data.user.username),
        demoUser: u,
        toast: tf('toast.entered', { login: u.login, short: u.short, role: u.role }),
      });
    } catch (e) {
      setOtpStatus(String(e.message || e), 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = t('login.verify');
        btn.setAttribute('data-i18n', 'login.verify');
      }
    }
  }

  function bindOtpLogin() {
    const send = $('#btn-otp-send');
    const verify = $('#btn-otp-verify');
    const resend = $('#btn-otp-resend');
    const email = $('#otp-email');
    const code = $('#otp-code');
    if (send) send.addEventListener('click', () => requestOtpCode());
    if (verify) verify.addEventListener('click', () => verifyOtpCode());
    if (resend) resend.addEventListener('click', () => requestOtpCode());
    if (email) {
      email.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); requestOtpCode(); }
      });
    }
    if (code) {
      code.addEventListener('input', () => {
        code.value = code.value.replace(/\D/g, '').slice(0, 6);
      });
      code.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); verifyOtpCode(); }
      });
    }
  }

  // ——— Enter demo ———
  function enterDemo() {
    try {
      sessionStorage.setItem('gilil_shell_v2_demo', 'ru1');
      // Soft-login: store a marker; optionally try real token in background
      localStorage.setItem('gilil_demo_user', JSON.stringify(DEMO_USER()));
    } catch (_) {}
    $('#login-gate').classList.add('hidden');
    $('#app-shell').classList.remove('hidden');
    $('#fab-tasks').classList.remove('hidden');
    renderChats();
    renderPlan();
    renderTasks();
    renderCrm();
    loadAndRenderLeads();
    renderTenders();
    renderTv();
    renderStorage();
    applyMailRoleUI();
    applyActivityRoleUI();
    openTeamChats('projects');
    applyRoleUI();
    applyLang(currentLang, { silent: true });
    toast(tf('toast.entered', { login: DEMO_USER().login, short: DEMO_USER().short, role: DEMO_USER().role }));

    // Soft try real auth (non-blocking; demo works without it)
    const rememberMe = isRememberMe();
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: DEMO_USER().username || 'manager_ru',
        password: DEMO_USER().password || 'mgr123',
        rememberMe: !!rememberMe,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.token) storeAuthTokens(data, rememberMe);
      })
      .catch(() => {});

    // Auto beep once if overdue tasks exist (simulate >1h unchecked)
    setTimeout(() => {
      if (!beepPlayed && overdueCount() > 0) {
        beepPlayed = true;
        playBeep();
      }
      // Invoice pending Ruslan: notify when acting as admin
      updateInvoiceAlert();
      loadNotifications();
      connectNotifWs();
      if (typeof loadServerTasks === 'function') loadServerTasks();
      if (typeof loadReplyStatuses === 'function') loadReplyStatuses();
    }, 1800);
  }

  // ——— Wire events ———

  // ——— Themes ———
  const THEME_IDS = ['dark', 'bitrix', 'cyan']; // only these in UI switcher
  const THEME_KEY = 'gilil_theme';
  let currentTheme = 'dark';

  function pushThemeToFrames(theme) {
    try {
      document.querySelectorAll('iframe').forEach((frame) => {
        try {
          frame.contentWindow.postMessage({ type: 'gilil:theme', theme: theme || currentTheme }, location.origin);
        } catch (_) {}
      });
    } catch (_) {}
  }

  window.addEventListener('message', (e) => {
    try {
      if (e.origin !== location.origin) return;
      const ready = e.data && (e.data.type === 'gilil:tv-ready' || e.data.type === 'gilil:news-ready' || e.data.type === 'gilil:frame-ready');
      if (ready) {
        pushThemeToFrames(currentTheme);
      }
    } catch (_) {}
  });

  function applyTheme(id, opts) {
    const silent = opts && opts.silent;
    if (id === 'beige') id = 'bitrix';
    if (id === 'blue') id = 'cyan';
    const theme = THEME_IDS.includes(id) ? id : 'dark';
    currentTheme = theme;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    // Push theme to same-origin iframes (SRM TV) immediately.
    pushThemeToFrames(theme);
    // Electron splash next launch: only dark | bitrix | cyan
    try {
      if (window.gililDesktop && typeof window.gililDesktop.setTheme === 'function') {
        const splashTheme = (theme === 'bitrix' || theme === 'cyan') ? theme : 'dark';
        window.gililDesktop.setTheme(splashTheme);
      }
    } catch (_) {}

    const sel = document.getElementById('theme-select');
    if (sel && sel.value !== theme) sel.value = theme;
    const sel2 = document.getElementById('theme-select-personal');
    if (sel2 && sel2.value !== theme) sel2.value = theme;

    document.querySelectorAll('.theme-swatch').forEach((btn) => {
      const id = btn.getAttribute('data-theme-id');
      const on = id === theme;
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      btn.title = t('theme.' + id);
    });

    if (!silent) {
      const name = t('theme.' + theme) || theme;
      toast(tf('toast.theme', { name }));
    }
  }

  function loadSavedTheme() {
    let id = 'dark';
    try {
      let saved = localStorage.getItem(THEME_KEY);
      if (saved === 'blue') saved = 'cyan'; // legacy
      if (saved === 'beige') saved = 'bitrix'; // legacy
      if (saved && THEME_IDS.includes(saved)) id = saved;
    } catch (_) {}
    let urlTheme = new URLSearchParams(location.search).get('theme');
    if (urlTheme === 'blue') urlTheme = 'cyan';
    if (urlTheme === 'beige') urlTheme = 'bitrix';
    if (urlTheme && THEME_IDS.includes(urlTheme)) id = urlTheme;
    applyTheme(id, { silent: true });
  }

  function toggleThemePopover(force) {
    const pop = document.getElementById('theme-popover');
    const btn = document.getElementById('btn-theme-gear');
    if (!pop || !btn) return;
    const open = typeof force === 'boolean' ? force : pop.classList.contains('hidden');
    pop.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && typeof openProfileCard === 'function') openProfileCard(false);
  }

  function bind() {
    bindOtpLogin();
    $('#btn-enter').addEventListener('click', enterDemo);

    fillLangSelects();
    document.querySelectorAll('.lang-select').forEach((sel) => {
      sel.addEventListener('change', () => applyLang(sel.value));
    });
    // Default UI language: CN (demo). ?lang=xx overrides; otherwise restore last choice.
    let startLang = 'zh';
    const urlLang = new URLSearchParams(location.search).get('lang');
    if (urlLang && isUiLang(urlLang)) {
      startLang = urlLang.toLowerCase();
    } else if (new URLSearchParams(location.search).get('demo') === '1') {
      startLang = 'zh';
    } else {
      try {
        const saved = localStorage.getItem('gilil_shell_v2_lang');
        if (saved && isUiLang(saved)) startLang = saved;
      } catch (_) {}
    }
    applyLang(startLang, { silent: true });

    // Theme switcher
    loadSavedTheme();
    document.querySelectorAll('iframe').forEach((frame) => {
      frame.addEventListener('load', () => pushThemeToFrames(currentTheme));
    });
    const themeSel = $('#theme-select');
    if (themeSel) {
      themeSel.addEventListener('change', () => applyTheme(themeSel.value));
    }
    const themeSelP = $('#theme-select-personal');
    if (themeSelP) {
      themeSelP.addEventListener('change', () => applyTheme(themeSelP.value));
    }
    document.querySelectorAll('.theme-swatch').forEach((btn) => {
      btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme-id')));
    });
    function closeSettingsPopover() {
      const pop = document.getElementById('theme-popover');
      const btn = document.getElementById('btn-theme-gear');
      if (pop) pop.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
    function bindSettingsLink(id, section) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        closeSettingsPopover();
        setSection(section);
      });
    }
    bindSettingsLink('btn-settings-tv', 'tv');
    bindSettingsLink('btn-settings-funnel', 'funnel');
    bindSettingsLink('btn-settings-usefulness', 'usefulness');
    bindSettingsLink('btn-settings-director', 'director');
    async function openGililManual() {
      closeSettingsPopover();
      if (!(window.gililDesktop && typeof window.gililDesktop.openManual === 'function')) {
        toast(t('settings.manual_missing'));
        return;
      }
      try {
        const res = await window.gililDesktop.openManual();
        if (!res || !res.ok) {
          toast(t('settings.manual_missing'));
        }
      } catch (_) {
        toast(t('settings.manual_missing'));
      }
    }
    ['btn-settings-manual', 'btn-settings-manual-personal'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => { openGililManual(); });
    });
    const gear = $('#btn-theme-gear');
    if (gear) {
      gear.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleThemePopover();
      });
    }
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('theme-popover-wrap');
      if (!wrap) return;
      if (!wrap.contains(e.target)) toggleThemePopover(false);
    });

    initNotifications();

    const userchipBtn = $('#userchip');
    if (userchipBtn) {
      userchipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof toggleThemePopover === 'function') toggleThemePopover(false);
        if (typeof toggleNotifPanel === 'function') toggleNotifPanel(false);
        toggleProfileCard();
      });
    }

    $$('#pills .pill[data-section]').forEach((p) => {
      p.addEventListener('click', () =>
        setSection(p.getAttribute('data-section'))
      );
    });
    const btnTpAdd = $('#btn-tp-add');
    if (btnTpAdd) btnTpAdd.addEventListener('click', () => addTasksPlansTask());
    if (typeof bindCalendarUI === 'function') bindCalendarUI();
    $$('#pills .pill[data-team]').forEach((p) => {
      p.addEventListener('click', () => openTeamChats(p.getAttribute('data-team')));
    });
    initTeamVisibilityUI();
    syncPillsActive(currentSection || 'chats');
    applyMailRoleUI();
    applyActivityRoleUI();

    const btnSync = $('#btn-mail-sync');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        const out = await mailApi('/api/mail/sync', { method: 'POST', body: { mock: true } });
        toast(out.status === 200 ? 'Sync: ' + (out.data.mode || 'ok') : 'Sync error');
        loadMail();
      });
    }
    const btnTpl = $('#btn-mail-templates');
    if (btnTpl) {
      btnTpl.addEventListener('click', async () => {
        if (!isMailStatsRole()) {
          toast(t('toast.tpl_deny'));
          return;
        }
        const r = await mailApi('/api/mail/templates');
        const n = (r.data && r.data.items && r.data.items.length) || 0;
        toast(tf('toast.tpl_count', { n }));
      });
    }
    document.querySelectorAll('[data-mail-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        mailTab = b.getAttribute('data-mail-tab');
        document.querySelectorAll('[data-mail-tab]').forEach((x) =>
          x.classList.toggle('active', x === b)
        );
        loadMail();
      });
    });
    document.querySelectorAll('[data-mail-period]').forEach((b) => {
      b.addEventListener('click', () => {
        mailPeriod = b.getAttribute('data-mail-period');
        document.querySelectorAll('[data-mail-period]').forEach((x) =>
          x.classList.toggle('active', x === b)
        );
        renderMailStats();
      });
    });


    const adminBtn = $('#btn-admin-users');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        if (currentRole !== 'admin') {
          toast(t('toast.admin_only'));
          return;
        }
        toast(t('toast.admin_users'));
      });
    }

    $$('.tf').forEach((b) => {
      b.addEventListener('click', () => {
        taskFilter = b.getAttribute('data-filter');
        renderTasks();
      });
    });

    const btnNewInv = $('#btn-new-invoice');
    if (btnNewInv) btnNewInv.addEventListener('click', openInvoiceCreate);
    const invClose = $('#inv-create-close');
    const invCancel = $('#inv-create-cancel');
    if (invClose) invClose.addEventListener('click', closeInvoiceCreate);
    if (invCancel) invCancel.addEventListener('click', closeInvoiceCreate);
    const invModal = $('#invoice-create-modal');
    if (invModal) {
      invModal.addEventListener('click', (e) => {
        if (e.target.id === 'invoice-create-modal') closeInvoiceCreate();
      });
    }
    const invSubmit = $('#inv-create-submit');
    if (invSubmit) {
      invSubmit.addEventListener('click', () => {
        const company = ($('#inv-company').value || '').trim();
        const amount = Number($('#inv-amount').value);
        const desc = ($('#inv-desc').value || '').trim();
        if (!company || !amount || amount <= 0) {
          toast(t('toast.inv_need'));
          return;
        }
        closeInvoiceCreate();
        createInvoice(company, amount, desc);
      });
    }

    const tmApprove = $('#tm-approve');
    const tmReject = $('#tm-reject');
    const tmClose3 = $('#tm-close3');
    if (tmApprove) tmApprove.addEventListener('click', () => { if (openTaskId) approveInvoice(openTaskId); });
    if (tmReject) tmReject.addEventListener('click', () => { if (openTaskId) rejectInvoice(openTaskId); });
    if (tmClose3) tmClose3.addEventListener('click', closeTaskModal);

    $('#chat-search').addEventListener('input', renderChats);

    const msgSearch = $('#chat-msg-search');
    if (msgSearch) {
      msgSearch.addEventListener('input', () => {
        chatMsgQuery = (msgSearch.value || '').trim().toLowerCase();
        if (selectedChat) openChatThread(selectedChat);
      });
    }
    const df = $('#chat-date-from');
    const dt = $('#chat-date-to');
    if (df) {
      df.addEventListener('change', () => {
        chatDateFrom = df.value || '';
        if (selectedChat) openChatThread(selectedChat);
      });
    }
    if (dt) {
      dt.addEventListener('change', () => {
        chatDateTo = dt.value || '';
        if (selectedChat) openChatThread(selectedChat);
      });
    }
    const btnMedia = $('#chat-filter-media');
    const btnPhoto = $('#chat-filter-photo');
    const btnClear = $('#chat-filter-clear');
    if (btnMedia) {
      btnMedia.addEventListener('click', () => {
        chatMediaOnly = !chatMediaOnly;
        if (chatMediaOnly) chatPhotoOnly = false;
        btnMedia.setAttribute('aria-pressed', chatMediaOnly ? 'true' : 'false');
        if (btnPhoto) btnPhoto.setAttribute('aria-pressed', 'false');
        if (selectedChat) openChatThread(selectedChat);
      });
    }
    if (btnPhoto) {
      btnPhoto.addEventListener('click', () => {
        chatPhotoOnly = !chatPhotoOnly;
        if (chatPhotoOnly) chatMediaOnly = false;
        btnPhoto.setAttribute('aria-pressed', chatPhotoOnly ? 'true' : 'false');
        if (btnMedia) btnMedia.setAttribute('aria-pressed', 'false');
        if (selectedChat) openChatThread(selectedChat);
      });
    }
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        chatMsgQuery = '';
        chatDateFrom = '';
        chatDateTo = '';
        chatMediaOnly = false;
        chatPhotoOnly = false;
        if (msgSearch) msgSearch.value = '';
        if (df) df.value = '';
        if (dt) dt.value = '';
        if (btnMedia) btnMedia.setAttribute('aria-pressed', 'false');
        if (btnPhoto) btnPhoto.setAttribute('aria-pressed', 'false');
        if (selectedChat) openChatThread(selectedChat);
        toast(t('toast.chat_filters'));
      });
    }

    
    /* gilil:top-menu-wheel */
    (function setupTopMenuWheel() {
      const nav = document.getElementById('pills');
      const bar = document.querySelector('.appbar');
      function onWheel(e) {
        const el = e.currentTarget === bar ? nav : e.currentTarget;
        if (el && el.scrollWidth > el.clientWidth + 2) {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            el.scrollLeft += e.deltaY;
          }
        }
        e.stopPropagation();
      }
      if (nav) nav.addEventListener('wheel', onWheel, { passive: true });
      if (bar) bar.addEventListener('wheel', onWheel, { passive: true });
    })();

    (function setupFabDrag() {
      const fab = $('#fab-tasks');
      if (!fab) return;
      const KEY = 'gilil_fab_pos';
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startY = 0;
      let origL = 0;
      let origT = 0;

      function clampPos(left, top) {
        const maxL = Math.max(0, window.innerWidth - fab.offsetWidth);
        const maxT = Math.max(0, window.innerHeight - fab.offsetHeight);
        return {
          left: Math.max(0, Math.min(maxL, left)),
          top: Math.max(0, Math.min(maxT, top)),
        };
      }

      function applyPos(left, top) {
        const p = clampPos(left, top);
        fab.style.left = p.left + 'px';
        fab.style.top = p.top + 'px';
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
        return p;
      }

      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
            applyPos(saved.left, saved.top);
          }
        }
      } catch (_) {}

      window.addEventListener('resize', () => {
        if (!fab.style.left) return;
        const left = parseFloat(fab.style.left);
        const top = parseFloat(fab.style.top);
        if (Number.isFinite(left) && Number.isFinite(top)) applyPos(left, top);
      });

      fab.addEventListener('pointerdown', (e) => {
        if (e.button != null && e.button !== 0) return;
        dragging = true;
        moved = false;
        const rect = fab.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origL = rect.left;
        origT = rect.top;
        fab.classList.add('dragging');
        try { fab.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
      });

      fab.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
        applyPos(origL + dx, origT + dy);
      });

      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        fab.classList.remove('dragging');
        try {
          const p = clampPos(parseFloat(fab.style.left) || 0, parseFloat(fab.style.top) || 0);
          localStorage.setItem(KEY, JSON.stringify(p));
        } catch (_) {}
        try { if (e && e.pointerId != null) fab.releasePointerCapture(e.pointerId); } catch (_) {}
      }

      fab.addEventListener('pointerup', endDrag);
      fab.addEventListener('pointercancel', endDrag);

      fab.addEventListener('click', (e) => {
        if (moved) {
          e.preventDefault();
          e.stopImmediatePropagation();
          moved = false;
          return;
        }
        openProfileCard(true);
        const panel = document.querySelector('#sec-personal .tasks-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const first = tasks.find((t) => !t.done);
        if (first) openTaskModal(first.id);
      });
    })();

    $('#btn-demo-beep').addEventListener('click', () => {
      beepPlayed = true;
      playBeep();
    });
    $('#btn-open-tasks').addEventListener('click', () => {
      const first = tasks.find((t) => !t.done) || tasks[0];
      if (first) openTaskModal(first.id);
    });

    $('#task-modal-close').addEventListener('click', closeTaskModal);
    $('#tm-close2').addEventListener('click', closeTaskModal);
    $('#task-modal').addEventListener('click', (e) => {
      if (e.target.id === 'task-modal') closeTaskModal();
    });
    $('#tm-check').addEventListener('click', () => {
      if (!openTaskId) return;
      const t = tasks.find((x) => x.id === openTaskId);
      if (!t) return;
      toggleTask(t.id, !t.done);
    });
    $('#tm-beep').addEventListener('click', playBeep);

    $('#chat-send').addEventListener('click', sendChat);
    $('#chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChat();
    });
    bindVoiceControls();

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (typeof openCmdk === 'function') openCmdk();
        else if ($('#chat-search')) $('#chat-search').focus();
      }
    });

    // Skip gate if token in sessionStorage/localStorage (remember-me) or demo sess
    try {
      const sess = sessionStorage.getItem('gilil_shell_v2_demo');
      const token = getToken();
      const au = getAuthUser();
      if (token && au) {
        currentRole = mapServerUserToRole(au);
        const sessionKey =
          sess && String(sess).startsWith('otp:')
            ? sess
            : 'otp:' + (au.username || '');
        openShellAfterAuth({
          sessionKey,
          toast: tf('toast.entered', {
            login: DEMO_USER().login,
            short: DEMO_USER().short,
            role: DEMO_USER().role,
          }),
        });
      } else if (sess === 'ru1') {
        enterDemo();
      } else if (sess && String(sess).startsWith('otp:') && token) {
        openShellAfterAuth({
          sessionKey: sess,
          toast: tf('toast.entered', {
            login: DEMO_USER().login,
            short: DEMO_USER().short,
            role: DEMO_USER().role,
          }),
        });
      }
    } catch (_) {}

    // URL ?demo=1 auto-enter
    if (new URLSearchParams(location.search).get('demo') === '1') {
      enterDemo();
    }
    // URL ?profile=1 — open Personal section after shell is ready (screenshots / deep link)
    if (new URLSearchParams(location.search).get('profile') === '1') {
      setTimeout(() => {
        try {
          if (document.getElementById('app-shell') && !document.getElementById('app-shell').classList.contains('hidden')) {
            openProfileCard(true);
          }
        } catch (_) {}
      }, 700);
    }
  }


  // ——— Voice record + dictation (MediaRecorder + Web Speech API) ———
  const voiceState = {
    rec: null,
    stream: null,
    chunks: [],
    startedAt: 0,
    timer: null,
    blob: null,
    url: null,
    transcript: '',
    recognition: null,
    durationMs: 0,
  };

  function fmtVoiceTimer(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function setVoiceUi(mode) {
    const bar = $('#chat-voice-bar');
    const prev = $('#chat-voice-preview');
    const btn = $('#chat-voice-btn');
    if (bar) bar.classList.toggle('hidden', mode !== 'rec');
    if (prev) prev.classList.toggle('hidden', mode !== 'preview');
    if (btn) {
      btn.setAttribute('aria-pressed', mode === 'rec' ? 'true' : 'false');
      btn.classList.toggle('rec', mode === 'rec');
    }
  }

  function clearVoicePreview() {
    if (voiceState.url) {
      try { URL.revokeObjectURL(voiceState.url); } catch (_) {}
    }
    voiceState.blob = null;
    voiceState.url = null;
    voiceState.transcript = '';
    voiceState.durationMs = 0;
    voiceState.chunks = [];
    const audio = $('#chat-voice-audio');
    if (audio) { audio.removeAttribute('src'); audio.load(); }
    setVoiceUi('idle');
  }

  function stopSpeechRec() {
    try {
      if (voiceState.recognition) voiceState.recognition.stop();
    } catch (_) {}
    voiceState.recognition = null;
  }

  function speechLang() {
    // Voice STT is always Russian (CN colleagues get server-side 中文 translation)
    return 'ru-RU';
  }

  function makeRecognition(onResult, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = speechLang();
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (ev) => {
      let final = '';
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += t;
        else interim += t;
      }
      if (onResult) onResult(final, interim);
    };
    r.onerror = () => {};
    r.onend = () => { if (onEnd) onEnd(); };
    return r;
  }

  async function startVoiceRec() {
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      toast(t('chats.voice_need_https'));
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast(t('chats.voice_denied'));
      return;
    }
    clearVoicePreview();
    try {
      voiceState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_) {
      toast(t('chats.voice_denied'));
      return;
    }
    const mimeCandidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    let mime = '';
    for (const c of mimeCandidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
        mime = c;
        break;
      }
    }
    voiceState.chunks = [];
    voiceState.transcript = '';
    try {
      voiceState.rec = mime
        ? new MediaRecorder(voiceState.stream, { mimeType: mime })
        : new MediaRecorder(voiceState.stream);
    } catch (_) {
      voiceState.rec = new MediaRecorder(voiceState.stream);
    }
    voiceState.rec.ondataavailable = (e) => {
      if (e.data && e.data.size) voiceState.chunks.push(e.data);
    };
    voiceState.rec.onstop = () => {
      const type = (voiceState.rec && voiceState.rec.mimeType) || mime || 'audio/webm';
      voiceState.blob = new Blob(voiceState.chunks, { type });
      voiceState.durationMs = Date.now() - voiceState.startedAt;
      if (voiceState.url) {
        try { URL.revokeObjectURL(voiceState.url); } catch (_) {}
      }
      voiceState.url = URL.createObjectURL(voiceState.blob);
      const audio = $('#chat-voice-audio');
      if (audio) {
        audio.src = voiceState.url;
      }
      if (voiceState.stream) {
        voiceState.stream.getTracks().forEach((tr) => tr.stop());
        voiceState.stream = null;
      }
      stopSpeechRec();
      setVoiceUi('preview');
    };
    voiceState.startedAt = Date.now();
    voiceState.rec.start(250);
    const timerEl = $('#chat-voice-timer');
    if (voiceState.timer) clearInterval(voiceState.timer);
    voiceState.timer = setInterval(() => {
      if (timerEl) timerEl.textContent = fmtVoiceTimer(Date.now() - voiceState.startedAt);
    }, 250);
    setVoiceUi('rec');
    // Parallel STT via Web Speech API
    const rec = makeRecognition((final, interim) => {
      if (final) voiceState.transcript = (voiceState.transcript + ' ' + final).trim();
      else if (interim) {
        /* keep live interim only in memory until final */
      }
    });
    if (rec) {
      voiceState.recognition = rec;
      try { rec.start(); } catch (_) {}
    }
  }

  function stopVoiceRec() {
    if (voiceState.timer) {
      clearInterval(voiceState.timer);
      voiceState.timer = null;
    }
    stopSpeechRec();
    try {
      if (voiceState.rec && voiceState.rec.state !== 'inactive') voiceState.rec.stop();
    } catch (_) {
      setVoiceUi('idle');
    }
  }

  function cancelVoiceRec() {
    if (voiceState.timer) {
      clearInterval(voiceState.timer);
      voiceState.timer = null;
    }
    stopSpeechRec();
    try {
      if (voiceState.rec && voiceState.rec.state !== 'inactive') {
        voiceState.rec.onstop = () => {
          if (voiceState.stream) {
            voiceState.stream.getTracks().forEach((tr) => tr.stop());
            voiceState.stream = null;
          }
          clearVoicePreview();
        };
        voiceState.rec.stop();
        return;
      }
    } catch (_) {}
    if (voiceState.stream) {
      voiceState.stream.getTracks().forEach((tr) => tr.stop());
      voiceState.stream = null;
    }
    clearVoicePreview();
  }

  function authToken() {
    return getToken();
  }

  async function ensureLiveConversationId() {
    const token = authToken();
    if (!token) return null;
    if (window.__gililLiveConvId) return window.__gililLiveConvId;
    try {
      const headers = { Authorization: 'Bearer ' + token, Accept: 'application/json', 'Content-Type': 'application/json' };
      const list = await fetch('/api/conversations', { headers }).then((r) => r.json());
      const existing = (list.conversations || [])[0];
      if (existing && existing.id) {
        window.__gililLiveConvId = existing.id;
        return existing.id;
      }
      const created = await fetch('/api/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'shell-v2 voice', memberUsernames: ['ru1', 'cn1'] }),
      }).then((r) => r.json());
      if (created.conversation && created.conversation.id) {
        window.__gililLiveConvId = created.conversation.id;
        return created.conversation.id;
      }
    } catch (_) {}
    return null;
  }

  async function postVoiceToApi(blob, durationMs, transcript) {
    const token = authToken();
    const cid = await ensureLiveConversationId();
    if (!token || !cid) return null;
    const fd = new FormData();
    fd.append('audio', blob, 'voice.webm');
    if (durationMs != null) fd.append('duration_ms', String(Math.round(durationMs)));
    if (transcript) fd.append('transcript', transcript);
    const target = myChatLang() || 'zh';
    fd.append('target_lang', target);
    const res = await fetch('/api/conversations/' + cid + '/voice', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === 'contact_leak') {
        showChatLeak(data.reason, data.matched);
        toast(t('toast.contact_block'));
      }
      return null;
    }
    return data.message || null;
  }

  function mockVoiceSttLocal(durationMs) {
    const samples = [
      'Добрый день, КП по Альфа Лайт готово, отправлю до пятнадцати часов.',
      'Нужен статус по образцам для ЖК Фрунзенский, клиент ждёт завтра.',
      'Спецификация после КП загружена в shared RU, проверьте пожалуйста.',
      'Счёт на согласовании у директора, Reminder на завтра в одиннадцать.',
      'Пришлите трек-номер в общую папку, фото упаковки уже в чате.',
    ];
    const idx = Math.abs(Math.round(Number(durationMs) || 0)) % samples.length;
    return samples[idx];
  }

  async function sendVoiceMessage() {
    if (!voiceState.blob) return;
    let transcript = (voiceState.transcript || '').trim();
    if (transcript) {
      const leak = checkContactLeakClient(transcript);
      if (!leak.ok) {
        showChatLeak(leak.reason, leak.matched);
        toast(t('toast.contact_block'));
        return;
      }
    }
    if (!selectedChat) {
      selectedChat = 'ru-maria';
      renderChats();
      setSection('chats');
    }
    if (!THREADS[selectedChat]) THREADS[selectedChat] = [];
    const localUrl = voiceState.url;
    voiceState.url = null; // keep blob URL for bubble
    const dur = voiceState.durationMs;
    const apiMsg = await postVoiceToApi(voiceState.blob, dur, transcript);
    // Prefer server STT (Whisper/Google/mock) when browser Web Speech gave nothing
    if (apiMsg && apiMsg.transcript) transcript = String(apiMsg.transcript).trim();
    if (!transcript) transcript = mockVoiceSttLocal(dur);
    let translation = apiMsg && apiMsg.translation;
    let translation_zh = apiMsg && apiMsg.translation_zh;
    if (!translation && !translation_zh && transcript) {
      const detected = detectMsgLang(transcript) || 'ru';
      const my = myChatLang();
      const target = my === detected ? (my === 'zh' ? 'ru' : 'zh') : my;
      const auto = mockTranslateClient(transcript, detected, target);
      if (auto && auto !== transcript) {
        translation = { text: auto, from: detected, to: target, provider: 'client-mock' };
        if (target === 'zh') translation_zh = auto;
      }
    }
    const audioUrl = apiMsg && apiMsg.media_url
      ? apiMsg.media_url + (authToken() ? '' : '')
      : localUrl;
    // If API URL needs auth, keep local blob for demo playback
    const playUrl = localUrl || audioUrl;
    THREADS[selectedChat].push({
      me: true,
      kind: 'voice',
      media: 'voice',
      text: transcript,
      transcript,
      audioUrl: playUrl,
      media_url: apiMsg && apiMsg.media_url,
      duration_ms: dur,
      at: new Date().toISOString(),
      translation_zh,
      translation,
    });
    clearVoicePreview();
    openChatThread(selectedChat);
    toast(t('chats.voice_sent'));
  }

  function voiceToText() {
    const input = $('#chat-input');
    let text = (voiceState.transcript || '').trim();
    if (text) {
      const leak = checkContactLeakClient(text);
      if (!leak.ok) {
        showChatLeak(leak.reason, leak.matched);
        toast(t('toast.contact_block'));
        return;
      }
      if (input) {
        input.value = (input.value ? input.value + ' ' : '') + text;
        input.focus();
      }
      const mailBody = $('#mail-draft-body');
      if (mailBody && !mailBody.closest('.hidden')) {
        mailBody.value = (mailBody.value ? mailBody.value + ' ' : '') + text;
      }
      clearVoicePreview();
      return;
    }
    // No transcript from parallel STT — start live dictation into input
    clearVoicePreview();
    startDictationInto(input);
  }

  function startDictationInto(el) {
    if (!el) {
      toast(t('chats.voice_stt_fail'));
      return;
    }
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      toast(t('chats.voice_need_https'));
      return;
    }
    const rec = makeRecognition((final, interim) => {
      if (final) {
        el.value = (el.value ? el.value + ' ' : '') + final.trim();
      } else if (interim) {
        el.dataset.interim = interim;
      }
    }, () => {
      toast(t('chats.dictation'));
    });
    if (!rec) {
      toast(t('chats.voice_stt_fail'));
      return;
    }
    try {
      rec.start();
      toast(t('chats.voice_rec'));
      // auto-stop after 20s
      setTimeout(() => {
        try { rec.stop(); } catch (_) {}
      }, 20000);
    } catch (_) {
      toast(t('chats.voice_stt_fail'));
    }
  }

  function bindVoiceControls() {
    const mic = $('#chat-voice-btn');
    if (mic) {
      mic.addEventListener('click', () => {
        if (voiceState.rec && voiceState.rec.state === 'recording') stopVoiceRec();
        else startVoiceRec();
      });
    }
    const cancel = $('#chat-voice-cancel');
    if (cancel) cancel.addEventListener('click', cancelVoiceRec);
    const stop = $('#chat-voice-stop');
    if (stop) stop.addEventListener('click', stopVoiceRec);
    const sendV = $('#chat-voice-send');
    if (sendV) sendV.addEventListener('click', () => { sendVoiceMessage(); });
    const toText = $('#chat-voice-to-text');
    if (toText) toText.addEventListener('click', voiceToText);
    const discard = $('#chat-voice-discard');
    if (discard) discard.addEventListener('click', clearVoicePreview);
  }


  function getMyUserId() {
    try {
      const raw = localStorage.getItem('gilil_demo_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.id != null) return Number(u.id);
        if (u && u.user_id != null) return Number(u.user_id);
      }
    } catch (_) {}
    return null;
  }

  function serverChatIdOf(chatOrId) {
    const c = typeof chatOrId === 'object' && chatOrId ? chatOrId : findChat(chatOrId);
    if (c && c.serverId != null) return Number(c.serverId);
    const id = typeof chatOrId === 'string' ? chatOrId : (c && c.id);
    if (id && String(id).startsWith('srv-chat-')) {
      const n = Number(String(id).replace('srv-chat-', ''));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function mapServerMsg(m) {
    if (!m) return null;
    const myId = getMyUserId();
    const me = myId != null && Number(m.sender_id) === myId;
    const base = {
      id: m.id,
      me: !!me,
      text: m.text || '',
      at: m.created_at || m.at || new Date().toISOString(),
      sender: m.sender || null,
      server: true,
    };
    if (m.kind === 'voice' || m.media === 'voice') {
      return Object.assign(base, {
        kind: 'voice',
        media: 'voice',
        transcript: m.transcript || m.text || '',
        translation: m.translation || null,
        translation_zh: m.translation_zh || null,
        audioUrl: m.audioUrl || m.media_url || '',
        media_url: m.media_url || m.audioUrl || '',
        duration_ms: m.duration_ms || 0,
      });
    }
    return base;
  }

  async function loadServerThread(localId, serverId) {
    if (!serverId) return;
    const r = await apiFetch('/api/chats/' + serverId + '/messages?limit=200');
    if (!r.ok || !r.data || !Array.isArray(r.data.messages)) return;
    const mapped = r.data.messages.map(mapServerMsg).filter(Boolean);
    mapped._serverLoaded = true;
    mapped._serverLoading = false;
    THREADS[localId] = mapped;
    if (selectedChat === localId) openChatThread(localId);
  }

  function appendIncomingServerMessage(msg) {
    if (!msg || msg.chat_id == null) return;
    const localId = 'srv-chat-' + msg.chat_id;
    if (!THREADS[localId]) THREADS[localId] = [];
    if (msg.id != null && THREADS[localId].some((x) => x.id === msg.id)) return;
    THREADS[localId].push(mapServerMsg(msg));
    // Ensure chat appears in sidebar
    if (!findChat(localId)) {
      const bucket =
        (msg.region === 'CN' || msg.region === 'cn') ? CHATS.cn :
        (msg.kind === 'project' ? CHATS.projects : CHATS.ru);
      bucket.unshift({
        id: localId,
        serverId: Number(msg.chat_id),
        name: 'Chat #' + msg.chat_id,
        role: '',
        initials: 'CH',
        team: bucket === CHATS.cn ? 'cn' : bucket === CHATS.projects ? 'pr' : 'ru',
        unread: selectedChat === localId ? 0 : 1,
      });
      renderChats();
    } else if (selectedChat !== localId) {
      const c = findChat(localId);
      if (c) c.unread = (c.unread || 0) + 1;
      renderChats();
    }
    if (selectedChat === localId) openChatThread(localId);
  }

  async function sendChat() {
    const input = $('#chat-input');
    const text = (input.value || '').trim();
    if (!text) return;
    const leak = checkContactLeakClient(text);
    if (!leak.ok) {
      showChatLeak(leak.reason, leak.matched);
      toast(t('toast.contact_block'));
      return;
    }
    if (!selectedChat) {
      selectedChat = 'ru-maria';
      renderChats();
      openChatThread(selectedChat);
      setSection('chats');
    }
    const serverId = serverChatIdOf(selectedChat);
    input.value = '';
    const ban = $('#chat-leak-banner');
    if (ban) ban.classList.add('hidden');

    if (serverId && authToken()) {
      // Prefer HTTP so ACL + contact-leak errors surface; WS also fans out.
      const r = await apiFetch('/api/chats/' + serverId + '/messages', {
        method: 'POST',
        body: { text },
      });
      if (!r.ok) {
        if (r.data && r.data.error === 'contact_leak') {
          showChatLeak(r.data.reason, r.data.matched);
          toast(t('toast.contact_block'));
          return;
        }
        toast((r.data && (r.data.error || r.data.message)) || 'Send failed');
        return;
      }
      const msg = r.data && r.data.message;
      if (msg) {
        if (!THREADS[selectedChat]) THREADS[selectedChat] = [];
        if (!THREADS[selectedChat].some((x) => x.id === msg.id)) {
          THREADS[selectedChat].push(mapServerMsg(msg));
        }
      }
      // Also push via WS if connected (idempotent on receiver)
      try {
        if (notifWs && notifWs.readyState === 1) {
          notifWs.send(JSON.stringify({ type: 'message', chat_id: serverId, text }));
        }
      } catch (_) {}
      openChatThread(selectedChat);
      return;
    }

    // Demo / offline local-only fallback
    if (!THREADS[selectedChat]) THREADS[selectedChat] = [];
    const nowIso = new Date().toISOString();
    THREADS[selectedChat].push({ me: true, text, at: nowIso });
    openChatThread(selectedChat);
  }


  // ——— Notifications bell (P0) ———
  const NOTIF_SOUND_KEY = 'notif.sound';
  let notifItems = [];
  let notifCounts = { all: 0, message: 0, task: 0, invoice: 0, lead: 0, mail: 0 };
  let notifFilter = 'all';
  let notifWs = null;
  let notifWsTimer = null;
  let notifSoundOn = true;

  function getNotifSound() {
    try {
      const v = localStorage.getItem(NOTIF_SOUND_KEY);
      if (v === 'off') return false;
      if (v === 'on') return true;
    } catch (_) {}
    return true;
  }

  function setNotifSound(on) {
    notifSoundOn = !!on;
    try { localStorage.setItem(NOTIF_SOUND_KEY, on ? 'on' : 'off'); } catch (_) {}
    document.querySelectorAll('#notif-sound-toggle, #notif-sound-toggle-personal').forEach((el) => {
      if (el) el.checked = notifSoundOn;
    });
    if (window.gililDesktop && typeof window.gililDesktop.setNotifSound === 'function') {
      try { window.gililDesktop.setNotifSound(notifSoundOn); } catch (_) {}
    }
  }

  function playNotifChime() {
    if (!notifSoundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.3);
      setTimeout(() => { try { ctx.close(); } catch (_) {} }, 400);
    } catch (e) {
      console.warn('notif chime failed', e);
    }
  }

  function relativeTime(iso) {
    if (!iso) return '';
    const t = Date.parse(String(iso).includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    if (!Number.isFinite(t)) return String(iso).slice(0, 16);
    const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (sec < 60) return 'сейчас';
    if (sec < 3600) return Math.floor(sec / 60) + ' мин';
    if (sec < 86400) return Math.floor(sec / 3600) + ' ч';
    if (sec < 86400 * 7) return Math.floor(sec / 86400) + ' д';
    try {
      return new Date(t).toLocaleDateString();
    } catch (_) {
      return '';
    }
  }

  function notifTypeClass(type) {
    if (type === 'message') return 'msg';
    if (type === 'task') return 'task';
    if (type === 'invoice') return 'inv';
    if (type === 'lead') return 'lead';
    if (type === 'mail') return 'mail';
    return 'msg';
  }

  function notifTypeIcon(type) {
    if (type === 'message') return '💬';
    if (type === 'task') return '✓';
    if (type === 'invoice') return '¥';
    if (type === 'lead') return '✉';
    if (type === 'mail') return '✉';
    return '•';
  }

  function notifTypeLabel(type) {
    return t('notif.type.' + type) || type;
  }

  function updateBellBadge() {
    const badge = document.getElementById('bell-badge');
    if (!badge) return;
    const n = Number(notifCounts.all) || 0;
    if (n <= 0) {
      badge.hidden = true;
      badge.textContent = '0';
    } else {
      badge.hidden = false;
      badge.textContent = n > 99 ? '99+' : String(n);
    }
    if (window.gililDesktop && typeof window.gililDesktop.setTrayBadge === 'function') {
      try { window.gililDesktop.setTrayBadge(n); } catch (_) {}
    }
  }

  function updateFilterCounts() {
    const map = {
      all: notifCounts.all,
      message: notifCounts.message,
      task: notifCounts.task,
      invoice: notifCounts.invoice,
    };
    Object.keys(map).forEach((k) => {
      const el = document.getElementById('nf-cnt-' + k);
      if (!el) return;
      const n = Number(map[k]) || 0;
      if (n <= 0) {
        el.hidden = true;
        el.textContent = '0';
      } else {
        el.hidden = false;
        el.textContent = n > 99 ? '99+' : String(n);
      }
    });
    // refresh tab labels with i18n
    document.querySelectorAll('[data-notif-filter]').forEach((btn) => {
      const f = btn.getAttribute('data-notif-filter');
      const cnt = btn.querySelector('.cnt');
      const labelKey = 'notif.tab.' + (f === 'all' ? 'all' : f);
      const label = t(labelKey) || btn.textContent;
      btn.childNodes.forEach((n) => {
        if (n.nodeType === 3) n.remove();
      });
      btn.insertBefore(document.createTextNode(label + ' '), cnt || null);
    });
  }

  function filteredNotifItems() {
    if (notifFilter === 'all') return notifItems;
    return notifItems.filter((it) => it.type === notifFilter);
  }

  function renderNotifList() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    const items = filteredNotifItems();
    if (!items.length) {
      list.innerHTML =
        '<div class="notif-empty">' +
        '<div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>' +
        '<h3>' + escapeHtml(t('notif.empty') || 'Пока тихо') + '</h3>' +
        '<p>' + escapeHtml(t('notif.empty_sub') || '') + '</p></div>';
      return;
    }
    list.innerHTML = items
      .map((it) => {
        const unread = !it.read;
        const tc = notifTypeClass(it.type);
        const who = escapeHtml(it.actor_name || it.title || '');
        const what = escapeHtml(it.body || it.title || '');
        return (
          '<button type="button" class="nitem' +
          (unread ? ' unread' : '') +
          '" data-notif-id="' +
          it.id +
          '" data-notif-type="' +
          escapeHtml(it.type) +
          '">' +
          '<div class="av ' +
          tc +
          '">' +
          notifTypeIcon(it.type) +
          '</div>' +
          '<div class="body"><div class="who">' +
          who +
          ' <span class="type-tag ' +
          tc +
          '">' +
          escapeHtml(notifTypeLabel(it.type)) +
          '</span></div>' +
          '<div class="what">' +
          what +
          '</div></div>' +
          '<div class="meta-r"><span class="when">' +
          escapeHtml(relativeTime(it.created_at)) +
          '</span><span class="dot"></span></div></button>'
        );
      })
      .join('');
  }

  async function notifApi(path, opts) {
    const token = authToken();
    if (!token) return { ok: false, status: 401, data: null };
    const headers = { Accept: 'application/json', Authorization: 'Bearer ' + token };
    const o = opts || {};
    if (o.body != null) {
      headers['Content-Type'] = 'application/json';
    }
    try {
      const res = await fetch(path, {
        method: o.method || 'GET',
        headers,
        body: o.body != null ? JSON.stringify(o.body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: String(e.message || e) } };
    }
  }

  async function loadNotifications() {
    const q = notifFilter !== 'all' ? '?type=' + encodeURIComponent(notifFilter) : '';
    // Always fetch all for badge accuracy; filter client-side for tabs that need lead/mail in «Все»
    const r = await notifApi('/api/notifications?limit=80');
    if (!r.ok) return;
    notifItems = (r.data && r.data.items) || [];
    if (r.data && r.data.counts) notifCounts = Object.assign(notifCounts, r.data.counts);
    updateBellBadge();
    updateFilterCounts();
    renderNotifList();
  }

  function navigateForNotif(it) {
    if (!it) return;
    const type = it.type;
    if (type === 'message') {
      setSection('chats');
    } else if (type === 'escalation') {
      setSection('director');
    } else if (type === 'task') {
      openProfileCard(true);
    } else if (type === 'invoice') {
      setSection('crm');
    } else if (type === 'lead') {
      setSection('leads');
    } else if (type === 'mail') {
      setSection('mail');
    }
  }

  async function onNotifItemClick(id) {
    const it = notifItems.find((x) => String(x.id) === String(id));
    if (!it) return;
    if (!it.read) {
      const r = await notifApi('/api/notifications/' + id + '/read', { method: 'POST', body: {} });
      if (r.ok) {
        it.read = true;
        it.read_at = (r.data.item && r.data.item.read_at) || new Date().toISOString();
        if (r.data.counts) notifCounts = Object.assign(notifCounts, r.data.counts);
        else notifCounts.all = Math.max(0, (notifCounts.all || 1) - 1);
      }
    }
    updateBellBadge();
    updateFilterCounts();
    renderNotifList();
    toggleNotifPanel(false);
    navigateForNotif(it);
  }

  async function markAllNotifsRead() {
    const body = notifFilter !== 'all' ? { type: notifFilter } : {};
    const r = await notifApi('/api/notifications/read-all', { method: 'POST', body });
    if (r.ok && r.data && r.data.counts) {
      notifCounts = Object.assign(notifCounts, r.data.counts);
    }
    await loadNotifications();
  }

  function toggleNotifPanel(force) {
    const panel = document.getElementById('notif-panel');
    const btn = document.getElementById('btn-notif-bell');
    if (!panel || !btn) return;
    const open = typeof force === 'boolean' ? force : panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      toggleThemePopover(false);
      if (typeof openProfileCard === 'function') openProfileCard(false);
      loadNotifications();
    }
  }

  function shouldSkipChimeForMessage(n) {
    // Skip soft chime when user is already viewing chats (approx. "open chat")
    if (!n || n.type !== 'message') return false;
    try {
      if (typeof currentSection !== 'undefined' && currentSection === 'chats') return true;
    } catch (_) {}
    return false;
  }

  function onIncomingNotification(n) {
    if (!n || !n.id) return;
    const idx = notifItems.findIndex((x) => x.id === n.id);
    if (idx >= 0) notifItems[idx] = n;
    else notifItems.unshift(n);
    if (!n.read) {
      notifCounts.all = (notifCounts.all || 0) + (idx >= 0 ? 0 : 1);
      if (n.type && notifCounts[n.type] != null && idx < 0) {
        notifCounts[n.type] = (notifCounts[n.type] || 0) + 1;
      }
      if (!shouldSkipChimeForMessage(n)) playNotifChime();
      // Desktop toast when unfocused / minimized
      if (window.gililDesktop && typeof window.gililDesktop.notify === 'function') {
        try {
          window.gililDesktop.notify({
            id: n.id,
            title: n.actor_name || n.title || 'Gilil On',
            body: n.body || n.title || '',
            type: n.type,
            entity_type: n.entity_type,
            entity_id: n.entity_id,
          });
        } catch (_) {}
      }
    }
    updateBellBadge();
    updateFilterCounts();
    const panel = document.getElementById('notif-panel');
    if (panel && !panel.classList.contains('hidden')) renderNotifList();
  }

  function connectNotifWs() {
    const token = authToken();
    if (!token) return;
    if (notifWs) {
      try { notifWs.close(); } catch (_) {}
      notifWs = null;
    }
    try {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = proto + '//' + location.host + '/ws?token=' + encodeURIComponent(token);
      const ws = new WebSocket(url);
      notifWs = ws;
      ws.onmessage = (ev) => {
        let data;
        try { data = JSON.parse(ev.data); } catch (_) { return; }
        if (data && data.type === 'notification' && (data.notification || data.item)) {
          onIncomingNotification(data.notification || data.item);
        }
        if (data && data.type === 'reply_status' && typeof onReplyStatusPush === 'function') {
          onReplyStatusPush(data.item);
        }
        if (data && data.type === 'message' && data.message) {
          appendIncomingServerMessage(data.message);
        }
        if (data && data.type === 'message_ack' && data.message) {
          appendIncomingServerMessage(data.message);
        }
        if (data && data.type === 'escalation' && data.notification) {
          onIncomingNotification(data.notification);
        }
      };
      ws.onclose = () => {
        notifWs = null;
        if (notifWsTimer) clearTimeout(notifWsTimer);
        notifWsTimer = setTimeout(connectNotifWs, 4000);
      };
      ws.onerror = () => {
        try { ws.close(); } catch (_) {}
      };
    } catch (e) {
      console.warn('notif ws failed', e);
    }
  }

  function bindNotifUi() {
    notifSoundOn = getNotifSound();
    setNotifSound(notifSoundOn);

    const bell = document.getElementById('btn-notif-bell');
    if (bell) {
      bell.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotifPanel();
      });
    }
    const markAll = document.getElementById('btn-notif-read-all');
    if (markAll) markAll.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllNotifsRead();
    });
    document.querySelectorAll('[data-notif-filter]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifFilter = btn.getAttribute('data-notif-filter') || 'all';
        document.querySelectorAll('[data-notif-filter]').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
        renderNotifList();
      });
    });
    const list = document.getElementById('notif-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const item = e.target.closest('[data-notif-id]');
        if (!item) return;
        onNotifItemClick(item.getAttribute('data-notif-id'));
      });
    }
    document.querySelectorAll('#notif-sound-toggle, #notif-sound-toggle-personal').forEach((el) => {
      if (!el) return;
      el.checked = notifSoundOn;
      el.addEventListener('change', () => setNotifSound(el.checked));
    });

    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('notif-wrap');
      if (!wrap) return;
      if (!wrap.contains(e.target)) toggleNotifPanel(false);
    });

    if (window.gililDesktop && typeof window.gililDesktop.onNavigate === 'function') {
      window.gililDesktop.onNavigate((payload) => {
        if (!payload) return;
        if (payload.section) setSection(payload.section);
        else if (payload.type) navigateForNotif(payload);
        else if (payload.notifId) {
          const it = notifItems.find((x) => String(x.id) === String(payload.notifId));
          if (it) navigateForNotif(it);
        }
      });
    }
    if (window.gililDesktop && typeof window.gililDesktop.onMarkAllRead === 'function') {
      window.gililDesktop.onMarkAllRead(() => { markAllNotifsRead(); });
    }
    if (window.gililDesktop && typeof window.gililDesktop.onToggleSound === 'function') {
      window.gililDesktop.onToggleSound(() => setNotifSound(!notifSoundOn));
    }
  }

  // ——— Desktop auto-update banner ———
  let updateBannerDismissed = false;

  function tUpdate(key, vars) {
    try {
      if (typeof t === 'function') {
        let s = t(key);
        if (vars) {
          Object.keys(vars).forEach((k) => {
            s = String(s).replace('{' + k + '}', String(vars[k]));
          });
        }
        return s;
      }
    } catch (_) {}
    const fallback = {
      'update.available': 'Обновление доступно',
      'update.available_ver': 'Обновление доступно · v{ver}',
      'update.download': 'Загрузить',
      'update.downloading': 'Загрузка… {pct}%',
      'update.ready': 'Обновление загружено',
      'update.install': 'Установить и перезапустить',
      'update.error': 'Ошибка обновления: {err}',
    };
    let s = fallback[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = String(s).replace('{' + k + '}', String(vars[k]));
      });
    }
    return s;
  }

  function showUpdateBanner(show) {
    const el = document.getElementById('update-banner');
    if (!el) return;
    if (show) {
      el.classList.remove('hidden');
      el.removeAttribute('hidden');
    } else {
      el.classList.add('hidden');
      el.setAttribute('hidden', '');
    }
  }

  function renderUpdateStatus(st) {
    if (!st || !window.gililDesktop) return;
    const textEl = document.getElementById('update-banner-text');
    const prog = document.getElementById('update-banner-progress');
    const fill = document.getElementById('update-banner-bar-fill');
    const pctEl = document.getElementById('update-banner-pct');
    const btnDl = document.getElementById('btn-update-download');
    const btnInst = document.getElementById('btn-update-install');
    if (!textEl) return;

    const status = st.status;
    if (!st.enabled || status === 'skipped' || status === 'idle' || status === 'checking' || status === 'not-available') {
      if (status !== 'available' && status !== 'downloading' && status !== 'downloaded' && status !== 'error') {
        showUpdateBanner(false);
        return;
      }
    }

    if (updateBannerDismissed && status === 'available') {
      showUpdateBanner(false);
      return;
    }

    if (status === 'available') {
      updateBannerDismissed = false;
      showUpdateBanner(true);
      textEl.textContent = st.version
        ? tUpdate('update.available_ver', { ver: st.version })
        : tUpdate('update.available');
      if (prog) { prog.classList.add('hidden'); prog.setAttribute('hidden', ''); }
      if (btnDl) { btnDl.classList.remove('hidden'); btnDl.removeAttribute('hidden'); btnDl.disabled = false; }
      if (btnInst) { btnInst.classList.add('hidden'); btnInst.setAttribute('hidden', ''); }
    } else if (status === 'downloading') {
      updateBannerDismissed = false;
      showUpdateBanner(true);
      const pct = Math.max(0, Math.min(100, Math.round((st.progress && st.progress.percent) || 0)));
      textEl.textContent = tUpdate('update.downloading', { pct: pct });
      if (prog) { prog.classList.remove('hidden'); prog.removeAttribute('hidden'); }
      if (fill) fill.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
      if (btnDl) { btnDl.classList.add('hidden'); btnDl.setAttribute('hidden', ''); }
      if (btnInst) { btnInst.classList.add('hidden'); btnInst.setAttribute('hidden', ''); }
    } else if (status === 'downloaded') {
      updateBannerDismissed = false;
      showUpdateBanner(true);
      textEl.textContent = st.version
        ? (tUpdate('update.ready') + ' · v' + st.version)
        : tUpdate('update.ready');
      if (prog) { prog.classList.add('hidden'); prog.setAttribute('hidden', ''); }
      if (btnDl) { btnDl.classList.add('hidden'); btnDl.setAttribute('hidden', ''); }
      if (btnInst) { btnInst.classList.remove('hidden'); btnInst.removeAttribute('hidden'); }
    } else if (status === 'error') {
      // Keep quiet for transient check errors unless user already saw an update
      if (st.version) {
        showUpdateBanner(true);
        textEl.textContent = tUpdate('update.error', { err: (st.error || '').slice(0, 80) });
        if (btnDl) { btnDl.classList.remove('hidden'); btnDl.removeAttribute('hidden'); }
      }
    }
  }

  function bindUpdateUi() {
    if (!(window.gililDesktop && window.gililDesktop.isDesktop)) return;
    const btnDl = document.getElementById('btn-update-download');
    const btnInst = document.getElementById('btn-update-install');
    const btnDismiss = document.getElementById('btn-update-dismiss');
    if (btnDl) {
      btnDl.addEventListener('click', () => {
        if (typeof window.gililDesktop.downloadUpdate === 'function') {
          window.gililDesktop.downloadUpdate().catch(() => {});
        }
      });
    }
    if (btnInst) {
      btnInst.addEventListener('click', () => {
        if (typeof window.gililDesktop.installUpdate === 'function') {
          window.gililDesktop.installUpdate().catch(() => {});
        }
      });
    }
    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        updateBannerDismissed = true;
        showUpdateBanner(false);
      });
    }
    if (typeof window.gililDesktop.onUpdateStatus === 'function') {
      window.gililDesktop.onUpdateStatus((payload) => renderUpdateStatus(payload || {}));
    }
    if (typeof window.gililDesktop.getUpdateStatus === 'function') {
      window.gililDesktop.getUpdateStatus().then((st) => renderUpdateStatus(st || {})).catch(() => {});
    }
  }




  // ——— P0-3/4/5: Task from chat · ⌘K · Quick replies ———
  let serverTasks = [];
  let taskAssignees = [];
  let replyStatuses = []; // { dialog_id, employee_user_id, status, status_label, employee }
  let tfcContext = { text: '', dialogId: null };
  let cmdkActive = -1;
  let cmdkResults = [];
  let cmdkTimer = null;

  function apiFetch(path, opts) {
    const token = authToken();
    if (!token) return Promise.resolve({ ok: false, status: 401, data: null });
    const headers = { Accept: 'application/json', Authorization: 'Bearer ' + token };
    const o = opts || {};
    if (o.body != null) headers['Content-Type'] = 'application/json';
    return fetch(path, {
      method: o.method || 'GET',
      headers,
      body: o.body != null ? JSON.stringify(o.body) : undefined,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
      })
      .catch((e) => ({ ok: false, status: 0, data: { error: String(e.message || e) } }));
  }

  function mapServerTask(st) {
    if (!st) return null;
    const takenRaw = st.taken_at || st.created_at;
    const taken = takenRaw ? Date.parse(String(takenRaw).replace(' ', 'T') + (String(takenRaw).includes('Z') || String(takenRaw).includes('+') ? '' : 'Z')) : Date.now();
    const closed = st.closed_at ? Date.parse(String(st.closed_at).replace(' ', 'T') + 'Z') : null;
    const done = st.status === 'done' || st.done;
    const overdue = !done && st.type !== 'invoice' && Date.now() - (taken || Date.now()) > HOUR;
    return {
      id: 'srv-' + st.id,
      serverId: st.id,
      type: st.type === 'invoice' ? 'invoice' : 'regular',
      title: st.title,
      desc: st.description || st.source_message || '',
      takenAt: Number.isFinite(taken) ? taken : Date.now(),
      closedAt: Number.isFinite(closed) ? closed : null,
      done: !!done,
      overdue: !!overdue,
      fromChat: st.type === 'from_chat',
      assignee: st.assignee,
      creator: st.creator,
      source_dialog_id: st.source_dialog_id,
    };
  }

  function mergeTasksFromServer(items) {
    serverTasks = (items || []).map(mapServerTask).filter(Boolean);
    // Keep local demo invoice tasks + non-server regular demos that aren't replaced
    const localInvoices = tasks.filter((t) => t.type === 'invoice');
    const localDemo = tasks.filter((t) => t.type !== 'invoice' && !String(t.id).startsWith('srv-') && !t.fromServer);
    // Prefer server tasks; keep invoices (still client demo) + leftover local demos if server empty
    if (serverTasks.length) {
      tasks = serverTasks.concat(localInvoices);
    } else {
      tasks = localDemo.concat(localInvoices);
    }
    // mark
    tasks.forEach((t) => {
      if (String(t.id).startsWith('srv-')) t.fromServer = true;
    });
    renderTasks();
  }

  async function loadServerTasks() {
    const r = await apiFetch('/api/tasks?mine=1&limit=100');
    if (!r.ok) return;
    const list = (r.data && (r.data.items || r.data.tasks)) || [];
    mergeTasksFromServer(list);
  }

  async function loadTaskAssignees() {
    const r = await apiFetch('/api/tasks/assignees');
    if (!r.ok) return;
    taskAssignees = (r.data && r.data.users) || [];
    fillAssigneeSelect();
  }

  function fillAssigneeSelect() {
    const sel = $('#tfc-assignee');
    if (!sel) return;
    const list = taskAssignees.length
      ? taskAssignees
      : Object.keys(ROLES).map((k) => ({
          id: k,
          username: ROLES[k].username,
          display_name: t(ROLES[k].nameKey),
          role: k,
        }));
    sel.innerHTML = list
      .map((u) => {
        const lab = (u.display_name || u.username) + ' (@' + u.username + ' · ' + u.role + ')';
        return '<option value="' + escapeHtml(String(u.id)) + '">' + escapeHtml(lab) + '</option>';
      })
      .join('');
    // Prefer current user if numeric id known via /me later; default first
  }

  function bindMsgTaskButtons(box) {
    if (!box) return;
    box.querySelectorAll('[data-msg-task]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const bubble = btn.closest('.bubble');
        const text = (bubble && bubble.getAttribute('data-msg-text')) || '';
        openTaskFromChatModal({ text: text, dialogId: selectedChat });
      });
    });
  }

  function openTaskFromChatModal(ctx) {
    tfcContext = {
      text: (ctx && ctx.text) || '',
      dialogId: (ctx && ctx.dialogId) || selectedChat || null,
    };
    const title = (tfcContext.text || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const titleEl = $('#tfc-title');
    const descEl = $('#tfc-desc');
    if (titleEl) titleEl.value = title || '';
    if (descEl) {
      descEl.value = tfcContext.text
        ? tfcContext.text.slice(0, 2000)
        : '';
    }
    loadTaskAssignees().then(() => {
      const modal = $('#task-from-chat-modal');
      if (modal) modal.classList.remove('hidden');
      if (titleEl) titleEl.focus();
    });
  }

  function closeTaskFromChatModal() {
    const modal = $('#task-from-chat-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function submitTaskFromChat() {
    const title = ($('#tfc-title') && $('#tfc-title').value || '').trim();
    const description = ($('#tfc-desc') && $('#tfc-desc').value || '').trim();
    const assigneeRaw = $('#tfc-assignee') && $('#tfc-assignee').value;
    const notify = $('#tfc-notify') ? $('#tfc-notify').checked : true;
    if (!title) {
      toast(t('tfc.fail'));
      return;
    }
    let assignee_id = Number(assigneeRaw);
    // Demo fallback: map role keys to usernames then resolve after create locally
    const body = {
      title,
      description: description || null,
      source_dialog_id: tfcContext.dialogId || null,
      source_chat_id: tfcContext.dialogId || null,
      source_message: tfcContext.text || null,
      notify,
    };
    if (Number.isFinite(assignee_id)) body.assignee_id = assignee_id;

    const r = await apiFetch('/api/tasks', { method: 'POST', body });
    if (!r.ok || !r.data || !r.data.task) {
      // Offline / demo fallback: local task
      const id = 'local-' + Date.now();
      const task = {
        id,
        type: 'regular',
        title,
        desc: description,
        takenAt: Date.now(),
        closedAt: null,
        done: false,
        overdue: false,
        fromChat: true,
        fromServer: false,
      };
      tasks.unshift(task);
      renderTasks();
      closeTaskFromChatModal();
      toast(t('tfc.ok') + ' (local)');
      return;
    }
    const mapped = mapServerTask(r.data.task);
    if (mapped) {
      tasks = tasks.filter((x) => x.serverId !== mapped.serverId);
      tasks.unshift(mapped);
      renderTasks();
    } else {
      await loadServerTasks();
    }
    closeTaskFromChatModal();
    toast(t('tfc.ok'));
  }

  // Text selection → floating tip
  let selTipEl = null;
  function ensureSelTip() {
    if (selTipEl) return selTipEl;
    selTipEl = document.createElement('button');
    selTipEl.type = 'button';
    selTipEl.className = 'sel-task-tip';
    selTipEl.textContent = '📋';
    document.body.appendChild(selTipEl);
    selTipEl.addEventListener('click', (e) => {
      e.preventDefault();
      const text = selTipEl.getAttribute('data-text') || '';
      selTipEl.classList.remove('visible');
      openTaskFromChatModal({ text, dialogId: selectedChat });
    });
    return selTipEl;
  }
  function onChatSelectionChange() {
    const box = $('#chat-msgs');
    if (!box) return;
    const sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      if (selTipEl) selTipEl.classList.remove('visible');
      return;
    }
    const node = sel.anchorNode;
    if (!node || !box.contains(node.nodeType === 3 ? node.parentNode : node)) {
      if (selTipEl) selTipEl.classList.remove('visible');
      return;
    }
    const text = String(sel.toString() || '').trim();
    if (!text || text.length < 2) {
      if (selTipEl) selTipEl.classList.remove('visible');
      return;
    }
    const tip = ensureSelTip();
    tip.textContent = '📋 ' + (t('tfc.sel_tip') || 'Task');
    tip.setAttribute('data-text', text.slice(0, 2000));
    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      tip.style.left = Math.min(window.innerWidth - 140, Math.max(8, rect.left + rect.width / 2 - 40)) + 'px';
      tip.style.top = Math.max(8, rect.top - 36) + 'px';
      tip.classList.add('visible');
    } catch (_) {
      tip.classList.remove('visible');
    }
  }

  // ——— ⌘K palette ———
  function cmdkIcon(type) {
    const map = {
      chat: '💬',
      task: '✓',
      invoice: '🧾',
      project: '📁',
      crm: '🏢',
      tender: '🏛',
      lead: '🌱',
      mail: '✉',
      file: '📄',
      user: '👤',
    };
    return map[type] || '•';
  }

  function openCmdk() {
    const back = $('#cmdk-back');
    if (!back) return;
    back.classList.remove('hidden');
    cmdkActive = -1;
    const input = $('#cmdk-input');
    if (input) {
      input.value = '';
      input.placeholder = t('cmdk.ph') || input.placeholder;
      setTimeout(() => input.focus(), 20);
    }
    renderCmdkResults([]);
    // Prefill with a light local scan when empty query — show recent chats
    runCmdkSearch('');
  }

  function closeCmdk() {
    const back = $('#cmdk-back');
    if (back) back.classList.add('hidden');
    cmdkActive = -1;
  }

  function renderCmdkResults(results) {
    cmdkResults = results || [];
    const list = $('#cmdk-list');
    const empty = $('#cmdk-empty');
    if (!list) return;
    if (!cmdkResults.length) {
      list.innerHTML = '';
      if (empty) {
        empty.textContent = t('cmdk.empty') || 'Empty';
        empty.classList.remove('hidden');
      }
      return;
    }
    if (empty) empty.classList.add('hidden');
    list.innerHTML = cmdkResults
      .map((r, i) => {
        const active = i === cmdkActive ? ' active' : '';
        return (
          '<div class="cmdk-item' +
          active +
          '" role="option" data-cmdk-i="' +
          i +
          '">' +
          '<div class="ci-ico ' +
          escapeHtml(r.type || '') +
          '">' +
          cmdkIcon(r.type) +
          '</div>' +
          '<div class="ci-body"><div class="ci-title">' +
          escapeHtml(r.title || '') +
          '</div><div class="ci-sub">' +
          escapeHtml(r.subtitle || '') +
          '</div></div>' +
          '<div class="ci-type">' +
          escapeHtml(r.type || '') +
          '</div></div>'
        );
      })
      .join('');
    list.querySelectorAll('[data-cmdk-i]').forEach((el) => {
      el.addEventListener('click', () => {
        const i = Number(el.getAttribute('data-cmdk-i'));
        activateCmdkResult(i);
      });
    });
  }

  function localCmdkFallback(q) {
    const qq = String(q || '').trim().toLowerCase();
    const out = [];
    function add(type, id, title, subtitle, section, entity_id) {
      if (qq && !(title + ' ' + subtitle + ' ' + id).toLowerCase().includes(qq)) return;
      out.push({ type, id, title, subtitle, section, entity_id });
    }
    Object.keys(CHATS).forEach((g) => {
      (CHATS[g] || []).forEach((c) => {
        add('chat', c.id, chatDisplayName(c), chatDisplayRole(c), 'chats', c.id);
      });
    });
    tasks.forEach((task) => {
      add(
        task.type === 'invoice' ? 'invoice' : 'task',
        String(task.id),
        taskTitle(task),
        task.type === 'invoice' ? task.invoiceNo || 'invoice' : 'task',
        'personal',
        String(task.serverId || task.id)
      );
    });
    (typeof CRM !== 'undefined' ? CRM : []).forEach((c) => {
      add('crm', 'crm-' + c.id, c.name || c.company || 'CRM', c.side || '', 'crm', String(c.id));
    });
    return out.slice(0, 40);
  }

  async function runCmdkSearch(q) {
    const query = String(q || '').trim();
    if (!query) {
      renderCmdkResults(localCmdkFallback('').slice(0, 12));
      return;
    }
    const r = await apiFetch('/api/search?q=' + encodeURIComponent(query) + '&limit=40');
    if (r.ok && r.data && Array.isArray(r.data.results) && r.data.results.length) {
      renderCmdkResults(r.data.results);
    } else {
      renderCmdkResults(localCmdkFallback(query));
    }
  }

  function activateCmdkResult(i) {
    const r = cmdkResults[i];
    if (!r) return;
    closeCmdk();
    const section = r.section || (r.type === 'chat' ? 'chats' : r.type === 'mail' ? 'mail' : r.type === 'tender' ? 'tenders' : r.type === 'lead' ? 'leads' : r.type === 'crm' || r.type === 'project' ? 'crm' : r.type === 'file' ? 'storage' : 'personal');
    setSection(section);
    if (r.type === 'chat' || section === 'chats') {
      const cid = r.entity_id || r.id;
      // strip conv- prefix for real ids — demo ids stay
      const demoId = String(cid).replace(/^conv-/, '');
      // Prefer demo id if present in CHATS
      const found = findChat(String(cid)) || findChat(demoId);
      if (found) {
        selectedChat = found.id;
        renderChats();
        openChatThread(found.id);
      } else if (findChat(String(r.id))) {
        selectedChat = r.id;
        renderChats();
        openChatThread(r.id);
      }
    } else if (r.type === 'task' || r.type === 'invoice') {
      const tid = r.entity_id;
      const match =
        tasks.find((x) => String(x.serverId) === String(tid)) ||
        tasks.find((x) => String(x.id) === String(tid)) ||
        tasks.find((x) => String(x.id) === 'srv-' + tid);
      if (match) openTaskModal(match.id);
    }
  }

  function onCmdkKey(e) {
    const back = $('#cmdk-back');
    if (!back || back.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCmdk();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdkActive = Math.min(cmdkResults.length - 1, cmdkActive + 1);
      renderCmdkResults(cmdkResults);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdkActive = Math.max(0, cmdkActive - 1);
      renderCmdkResults(cmdkResults);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cmdkActive < 0 && cmdkResults.length) cmdkActive = 0;
      activateCmdkResult(cmdkActive);
    }
  }

  // ——— Quick replies (P0-5) ———
  const REPLY_LABELS = {
    read: 'cqr.read',
    replied: 'cqr.replied',
    in_progress: 'cqr.in_progress',
    done: 'cqr.done',
  };

  function isDirectorDialog(id) {
    return id && String(id).indexOf('dir-') === 0;
  }

  function updateQuickRepliesUI() {
    const bar = $('#chat-quick-replies');
    if (!bar) return;
    const show =
      currentSection === 'chats' &&
      selectedChat &&
      isDirectorDialog(selectedChat) &&
      (currentRole === 'ru' || currentRole === 'cn');
    bar.classList.toggle('hidden', !show);
    if (!show) return;
    const mine = replyStatuses.find(
      (s) => s.dialog_id === selectedChat && !s.cleared && s.status
    );
    // Prefer matching current employee — if multiple, take latest for this dialog by me
    bar.querySelectorAll('[data-reply-status]').forEach((btn) => {
      const st = btn.getAttribute('data-reply-status');
      btn.classList.toggle('active', !!(mine && mine.status === st));
      const key = REPLY_LABELS[st];
      if (key) btn.textContent = t(key);
    });
    const lab = bar.querySelector('.cqr-lab');
    if (lab) lab.textContent = t('cqr.label');
  }

  function replyBadgeHtml(chat) {
    if (!chat) return '';
    // Employee view: badge on director dialogs showing own status
    // Director/admin: show latest status for this dialog (any employee)
    let item = null;
    if (currentRole === 'admin' || currentRole === 'director') {
      const all = replyStatuses.filter((s) => s.dialog_id === chat.id && s.status && !s.cleared);
      if (all.length) item = all[0];
      // Also: when viewing team chats, match by employee username ↔ chat? skip for demo
    } else {
      item = replyStatuses.find((s) => s.dialog_id === chat.id && s.status && !s.cleared);
    }
    if (!item || !item.status) return '';
    const lab = item.status_label || t(REPLY_LABELS[item.status] || '') || item.status;
    const who =
      (currentRole === 'admin' || currentRole === 'director') && item.employee
        ? (item.employee.display_name || item.employee.username || '') + ': '
        : '';
    return (
      '<span class="reply-badge st-' +
      escapeHtml(item.status) +
      '" title="' +
      escapeHtml(who + lab) +
      '">' +
      escapeHtml(lab) +
      '</span>'
    );
  }

  async function loadReplyStatuses() {
    const r = await apiFetch('/api/reply-status');
    if (!r.ok) return;
    replyStatuses = ((r.data && r.data.items) || []).map(function (it) {
      if (it && it.dialog_id == null && it.chat_id != null) it.dialog_id = it.chat_id;
      return it;
    });
    renderChats();
    updateQuickRepliesUI();
  }

  function onReplyStatusPush(item) {
    if (!item) return;
    if (item.dialog_id == null && item.chat_id != null) item.dialog_id = item.chat_id;
    if (item.cleared || item.status == null) {
      replyStatuses = replyStatuses.filter(
        (s) =>
          !(
            s.dialog_id === item.dialog_id &&
            s.employee_user_id === item.employee_user_id
          )
      );
    } else {
      const idx = replyStatuses.findIndex(
        (s) =>
          s.dialog_id === item.dialog_id &&
          s.employee_user_id === item.employee_user_id
      );
      if (idx >= 0) replyStatuses[idx] = item;
      else replyStatuses.unshift(item);
    }
    renderChats();
    updateQuickRepliesUI();
  }

  async function setQuickReplyStatus(status) {
    if (!selectedChat || !isDirectorDialog(selectedChat)) return;
    const r = await apiFetch('/api/reply-status', {
      method: 'PUT',
      body: { chat_id: selectedChat, dialog_id: selectedChat, status },
    });
    if (!r.ok || !r.data || !r.data.item) {
      // local fallback
      const local = {
        dialog_id: selectedChat,
        employee_user_id: 0,
        status,
        status_label: t(REPLY_LABELS[status] || '') || status,
      };
      onReplyStatusPush(local);
      toast(tf('cqr.set', { status: local.status_label }));
      return;
    }
    onReplyStatusPush(r.data.item);
    toast(tf('cqr.set', { status: r.data.item.status_label || status }));
  }

  function bindP0Ui() {
    const tfcClose = $('#tfc-close');
    const tfcCancel = $('#tfc-cancel');
    const tfcSubmit = $('#tfc-submit');
    if (tfcClose) tfcClose.addEventListener('click', closeTaskFromChatModal);
    if (tfcCancel) tfcCancel.addEventListener('click', closeTaskFromChatModal);
    if (tfcSubmit) tfcSubmit.addEventListener('click', submitTaskFromChat);
    const tfcModal = $('#task-from-chat-modal');
    if (tfcModal) {
      tfcModal.addEventListener('click', (e) => {
        if (e.target.id === 'task-from-chat-modal') closeTaskFromChatModal();
      });
    }

    document.addEventListener('selectionchange', () => {
      if (currentSection !== 'chats') return;
      onChatSelectionChange();
    });
    document.addEventListener('mousedown', (e) => {
      if (selTipEl && !selTipEl.contains(e.target)) {
        // keep tip until click outside shortly
      }
    });

    const cmdkBack = $('#cmdk-back');
    if (cmdkBack) {
      cmdkBack.addEventListener('click', (e) => {
        if (e.target.id === 'cmdk-back') closeCmdk();
      });
    }
    const cmdkInput = $('#cmdk-input');
    if (cmdkInput) {
      cmdkInput.addEventListener('input', () => {
        clearTimeout(cmdkTimer);
        const v = cmdkInput.value;
        cmdkTimer = setTimeout(() => runCmdkSearch(v), 140);
      });
    }
    document.addEventListener('keydown', onCmdkKey);

    document.querySelectorAll('[data-reply-status]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const st = btn.getAttribute('data-reply-status');
        if (st) setQuickReplyStatus(st);
      });
    });

    // Also open cmdk from chats search focus hint double-meta already handled
    const chatSearch = $('#chat-search');
    if (chatSearch) {
      chatSearch.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          openCmdk();
        }
      });
    }
  }

  // Hook setSection to refresh quick replies
  const _setSectionOrig = typeof setSection === 'function' ? setSection : null;
  // setSection is a function declaration — wrap via patching call sites is hard;
  // instead refresh on chat open (already) and when section buttons clicked.
  document.addEventListener('click', (e) => {
    const pill = e.target.closest && e.target.closest('.pill[data-section]');
    if (pill) {
      setTimeout(() => {
        if (typeof updateQuickRepliesUI === 'function') updateQuickRepliesUI();
      }, 0);
    }
  });




  // ——— Stage 2 panels (funnel / activity / usefulness) + live chats ———
  function esc(s) {
    return escapeHtml(String(s == null ? '' : s));
  }

  async function loadFunnelPanel() {
    const root = document.getElementById('funnel-list');
    if (!root) return;
    root.textContent = '…';
    const r = await apiFetch('/api/funnels');
    if (!r.ok) {
      root.innerHTML = '<div class="stage2-err">Нет доступа или ошибка: ' + esc((r.data && r.data.error) || r.status) + '</div>';
      return;
    }
    const items = (r.data && r.data.items) || [];
    if (!items.length) {
      root.innerHTML = '<div class="muted">Воронок пока нет</div>';
      return;
    }
    function fmtStepTimer(s) {
      const st = (s.status || s.state || '').toLowerCase();
      const start = s.started_at ? Date.parse(String(s.started_at).replace(' ', 'T') + (String(s.started_at).includes('Z') || String(s.started_at).includes('+') ? '' : 'Z')) : NaN;
      const endRaw = s.finished_at || null;
      const end = endRaw
        ? Date.parse(String(endRaw).replace(' ', 'T') + (String(endRaw).includes('Z') || String(endRaw).includes('+') ? '' : 'Z'))
        : (st === 'in_progress' || st === 'active' ? Date.now() : NaN);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return '';
      let ms = Math.max(0, end - start);
      const days = Math.floor(ms / 86400000);
      const hours = Math.floor((ms % 86400000) / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      let label;
      if (days >= 1) label = days + 'д ' + hours + 'ч';
      else if (hours >= 1) label = hours + 'ч ' + mins + 'м';
      else label = Math.max(1, mins) + 'м';
      return '⏱ ' + label;
    }
    root.innerHTML = items
      .map((it) => {
        const steps = (it.steps || it.step_list || []).map((s) => {
          const st = (s.status || s.state || '').toLowerCase();
          const cls = st === 'done' || st === 'completed' ? 'done' : st === 'active' || st === 'in_progress' ? 'active' : '';
          const label = s.step_label || s.label || s.name || s.step || s.key || '?';
          const who = s.assignee_name || (s.assignee && (s.assignee.display_name || s.assignee.username)) || '';
          const timer = fmtStepTimer(s);
          return '<span class="stage2-step ' + cls + '" data-started="' + esc(s.started_at || '') + '" data-finished="' + esc(s.finished_at || '') + '" data-st="' + esc(st) + '">' + esc(label) + (who ? ' · ' + esc(who) : '') + (timer ? ' · <span class="funnel-step-timer">' + esc(timer) + '</span>' : '') + '</span>';
        }).join('');
        return (
          '<div class="stage2-card"><h3>' +
          esc(it.title || it.order_code || it.code || ('#' + it.id)) +
          '</h3><div class="meta">' +
          esc(it.status || '') +
          (it.region ? ' · ' + esc(it.region) : '') +
          '</div><div class="stage2-steps">' +
          (steps || '<span class="muted">нет шагов</span>') +
          '</div></div>'
        );
      })
      .join('');
    // Live-update in-progress step timers every 30s while panel is visible.
    if (window.__funnelTimerTick) clearInterval(window.__funnelTimerTick);
    window.__funnelTimerTick = setInterval(() => {
      if (typeof currentSection !== 'undefined' && currentSection !== 'funnel') return;
      document.querySelectorAll('#funnel-list .stage2-step[data-st="in_progress"], #funnel-list .stage2-step[data-st="active"]').forEach((el) => {
        const fake = { status: el.getAttribute('data-st'), started_at: el.getAttribute('data-started'), finished_at: null };
        const t = fmtStepTimer(fake);
        const span = el.querySelector('.funnel-step-timer');
        if (t && span) span.textContent = t;
        else if (t && !span) {
          el.insertAdjacentHTML('beforeend', ' · <span class="funnel-step-timer">' + esc(t) + '</span>');
        }
      });
    }, 30000);
  }

  async function loadActivityPanel() {
    const root = document.getElementById('activity-list');
    if (!root) return;
    root.textContent = '…';
    const r = await apiFetch('/api/activity?limit=80');
    if (!r.ok) {
      root.innerHTML = '<div class="stage2-err">Нет доступа или ошибка: ' + esc((r.data && r.data.error) || r.status) + '</div>';
      return;
    }
    const items = (r.data && (r.data.items || r.data.events || r.data.logs)) || [];
    if (!items.length) {
      root.innerHTML = '<div class="muted">Записей нет</div>';
      return;
    }
    root.innerHTML = items
      .map((it) => {
        const who = (it.user && (it.user.display_name || it.user.username)) || it.username || it.user_id || '';
        return (
          '<div class="stage2-card"><h3>' +
          esc(it.action || it.type || 'event') +
          '</h3><div class="meta">' +
          esc(who) +
          (it.created_at ? ' · ' + esc(it.created_at) : '') +
          (it.detail ? ' · ' + esc(it.detail) : '') +
          '</div></div>'
        );
      })
      .join('');
  }


  async function loadMyUsefulnessProfile() {
    const scoreEl = document.getElementById('who-score');
    const commentEl = document.getElementById('who-score-comment');
    const atEl = document.getElementById('who-score-at');
    const hireEl = document.getElementById('who-hire-date');
    const timeEl = document.getElementById('who-time-in-app');
    if (!scoreEl) return;
    if (!authToken()) {
      if (scoreEl) scoreEl.textContent = '—';
      if (commentEl) commentEl.textContent = '—';
      if (atEl) atEl.textContent = '—';
      if (hireEl) hireEl.textContent = '—';
      if (timeEl) timeEl.textContent = '—';
      return;
    }
    const r = await apiFetch('/api/usefulness/me');
    if (!r.ok || !r.data) {
      if (scoreEl) scoreEl.textContent = '—';
      if (commentEl) commentEl.textContent = '—';
      if (atEl) atEl.textContent = '—';
      if (hireEl) hireEl.textContent = '—';
      if (timeEl) timeEl.textContent = '—';
      return;
    }
    const s = r.data.score || r.data;
    const eff = s.effective_score != null ? s.effective_score : (s.override_score != null ? s.override_score : s.auto_score);
    if (scoreEl) scoreEl.textContent = eff != null ? String(eff) : '—';
    if (commentEl) commentEl.textContent = s.override_comment || '—';
    if (atEl) atEl.textContent = s.override_at || s.computed_at || '—';
    if (hireEl) hireEl.textContent = s.hire_date || '—';
    if (timeEl) timeEl.textContent = s.time_in_app || '—';
  }

  async function loadUsefulnessPanel() {
    const root = document.getElementById('usefulness-list');
    if (!root) return;
    root.textContent = '…';
    const r = await apiFetch('/api/usefulness');
    if (!r.ok) {
      root.innerHTML = '<div class="stage2-err">Нет доступа или ошибка: ' + esc((r.data && r.data.error) || r.status) + '</div>';
      return;
    }
    const items = (r.data && r.data.items) || [];
    if (!items.length) {
      root.innerHTML = '<div class="muted">Нет данных</div>';
      return;
    }
    root.innerHTML = items
      .map((it) => {
        const who = (it.user && (it.user.display_name || it.user.username)) || it.display_name || it.username || it.user_name || ('#' + (it.user_id || '?'));
        const score = it.effective_score != null ? it.effective_score : (it.score != null ? it.score : it.coefficient != null ? it.coefficient : it.value);
        return (
          '<div class="stage2-card"><h3>' +
          esc(who) +
          ' · ' +
          esc(score) +
          '</h3><div class="meta">' +
          esc(it.comment || it.note || it.alert || '') +
          (it.updated_at ? ' · ' + esc(it.updated_at) : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  function bucketForServerChat(c) {
    const kind = String(c.kind || '').toLowerCase();
    const region = String(c.region || '').toUpperCase();
    if (kind === 'project' || kind === 'pr') return 'projects';
    if (kind === 'director' || kind === 'dir') return 'director';
    if (region === 'CN') return 'cn';
    if (region === 'RU') return 'ru';
    if (kind === 'team_cn') return 'cn';
    if (kind === 'team_ru') return 'ru';
    return 'projects';
  }

  async function loadServerChatsIntoSidebar() {
    const r = await apiFetch('/api/chats');
    if (!r.ok || !r.data || !Array.isArray(r.data.chats)) return;
    const buckets = { ru: CHATS.ru, cn: CHATS.cn, projects: CHATS.projects, director: CHATS.director || (CHATS.director = []) };
    const allExisting = new Set();
    Object.values(buckets).forEach((arr) => {
      (arr || []).forEach((x) => { if (x.serverId) allExisting.add(x.serverId); });
    });
    r.data.chats.forEach((c) => {
      if (allExisting.has(c.id)) return;
      const key = bucketForServerChat(c);
      const team = key === 'cn' ? 'cn' : key === 'ru' ? 'ru' : key === 'director' ? 'dir' : 'pr';
      const mapped = {
        id: 'srv-chat-' + c.id,
        serverId: c.id,
        nameKey: null,
        name: c.title || ('Chat #' + c.id),
        roleKey: null,
        role: (c.kind || '') + (c.region ? ' · ' + c.region : ''),
        initials: String(c.title || 'C').slice(0, 2).toUpperCase(),
        team,
        unread: 0,
        reply_badges: c.reply_badges || [],
        last_message: c.last_message || null,
        project_id: c.project_id || null,
        client_key: c.client_key || null,
      };
      if (!buckets[key]) buckets[key] = [];
      buckets[key].unshift(mapped);
      allExisting.add(c.id);
    });
    renderChats();
  }



  // ——— Project cards (localStorage + SQLite via API) ———
  const PCARD_LS = 'gilil_project_cards_v1';

  function readPcardLs() {
    try { return JSON.parse(localStorage.getItem(PCARD_LS) || '{}') || {}; } catch (_) { return {}; }
  }
  function writePcardLs(map) {
    try { localStorage.setItem(PCARD_LS, JSON.stringify(map || {})); } catch (_) {}
  }

  function projectKeyForChat(c) {
    if (!c) return null;
    if (c.client_key) return c.client_key;
    if (c.project_id) return 'pid-' + c.project_id;
    if (c.serverId) return 'chat-' + c.serverId;
    return c.id || null;
  }

  let activeProjectCard = null;

  function isDirectorViewer() {
    try {
      const au = JSON.parse(localStorage.getItem('gilil_auth_user') || 'null');
      if (au && (au.role === 'director' || au.role === 'general_admin' || au.role === 'manager')) return true;
    } catch (_) {}
    return currentRole === 'director' || currentRole === 'admin';
  }

  function localizePlanStatus(status) {
    if (status === 'в плане' || status === 'on track' || status === '按计划') return t('pcard.plan_on_track') || 'в плане';
    if (status === 'отстаёт' || status === 'behind' || status === '落后') return t('pcard.plan_behind') || 'отстаёт';
    if (status === 'выполнено' || status === 'done' || status === '已完成') return t('pcard.plan_done') || 'выполнено';
    return status || '—';
  }

  /** Client-side fallback from in-memory/demo tasks linked to a project. */
  function computePlanFromLocalTasks(projectId, clientKey) {
    const list = (typeof tasks !== 'undefined' && Array.isArray(tasks) ? tasks : []).filter((tk) => {
      if (tk.cancelled || tk.status === 'cancelled') return false;
      if (projectId != null && (tk.project_id === projectId || tk.projectId === projectId)) return true;
      if (clientKey && (tk.client_key === clientKey || tk.projectKey === clientKey)) return true;
      return false;
    });
    const total = list.length;
    const done = list.filter((tk) => tk.done || tk.status === 'done').length;
    const overdue = list.filter((tk) => {
      if (tk.done || tk.status === 'done') return false;
      if (tk.overdue) return true;
      if (tk.dueAt && tk.dueAt < Date.now()) return true;
      return false;
    }).length;
    const pct = total === 0 ? 0 : Math.round((100 * done) / total);
    let status = 'в плане';
    if (total > 0 && done === total) status = 'выполнено';
    else if (overdue > 0) status = 'отстаёт';
    return { plan_pct: pct, plan_status: status, plan_tasks_total: total, plan_tasks_done: done, plan_tasks_overdue: overdue };
  }

  function fillPlanStatusUi(card) {
    const wrap = document.getElementById('pcard-plan-wrap');
    const pctEl = document.getElementById('pcard-plan-pct');
    const badge = document.getElementById('pcard-plan-badge');
    const meta = document.getElementById('pcard-plan-meta');
    if (!wrap) return;
    const director = isDirectorViewer();
    wrap.classList.toggle('director-hidden', !director);
    if (!director) return;
    let plan = {
      plan_pct: card && card.plan_pct,
      plan_status: card && card.plan_status,
      plan_tasks_total: card && card.plan_tasks_total,
      plan_tasks_done: card && card.plan_tasks_done,
      plan_tasks_overdue: card && card.plan_tasks_overdue,
    };
    if (plan.plan_pct == null || plan.plan_status == null) {
      const local = computePlanFromLocalTasks(card && card.id, card && card.client_key);
      plan = Object.assign({}, local, plan.plan_pct != null ? { plan_pct: plan.plan_pct } : {}, plan.plan_status ? { plan_status: plan.plan_status } : {});
    }
    const pct = plan.plan_pct != null ? Number(plan.plan_pct) : 0;
    const status = plan.plan_status || 'в плане';
    if (pctEl) pctEl.textContent = String(pct) + '%';
    if (badge) {
      badge.setAttribute('data-status', status);
      badge.textContent = localizePlanStatus(status);
    }
    if (meta) {
      const total = plan.plan_tasks_total != null ? plan.plan_tasks_total : 0;
      const done = plan.plan_tasks_done != null ? plan.plan_tasks_done : 0;
      const overdue = plan.plan_tasks_overdue != null ? plan.plan_tasks_overdue : 0;
      const tpl = t('pcard.plan_meta') || '{done}/{total} задач · просрочено {overdue}';
      meta.textContent = tpl.replace('{done}', done).replace('{total}', total).replace('{overdue}', overdue);
    }
  }

  function fillProjectCardFields(card) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    set('pcard-company', card && card.company);
    set('pcard-tender', card && card.tender_no);
    set('pcard-desc', card && card.description);
    set('pcard-curator', card && card.curator);
    set('pcard-docs', card && card.docs_person);
    set('pcard-manager', card && card.manager);
    fillPlanStatusUi(card);
    const mem = document.getElementById('pcard-members');
    if (mem) {
      const members = (card && card.members) || [];
      mem.innerHTML = members.map((m) => {
        const u = m.user || m;
        const lab = (u.display_name || u.username || ('#' + (m.user_id || u.id))) +
          ' · ' + (m.role_label || (m.role === 'general' ? 'Генерал' : m.role || ''));
        const locked = m.locked || m.role === 'general' ? ' locked' : '';
        return '<span class="pcard-member' + locked + '">' + escapeHtml(lab) + '</span>';
      }).join('');
    }
  }

  async function showProjectCardForChat(c) {
    const panel = document.getElementById('project-card');
    if (!panel) return;
    const isProject = c && (c.team === 'pr' || (c.role && String(c.role).indexOf('project') >= 0) || c.project_id || (c.id && String(c.id).startsWith('pr-')));
    if (!isProject) {
      panel.classList.add('hidden');
      activeProjectCard = null;
      return;
    }
    panel.classList.remove('hidden');
    const key = projectKeyForChat(c);
    const ls = readPcardLs();
    let card = (key && ls[key]) || null;
    // Prefer server
    if (c && (c.project_id || c.serverId || (c.id && String(c.id).startsWith('pr-')))) {
      try {
        let r = null;
        if (c.project_id) r = await apiFetch('/api/projects/' + c.project_id);
        else if (key) {
          const all = await apiFetch('/api/projects');
          if (all.ok && all.data && Array.isArray(all.data.projects)) {
            const hit = all.data.projects.find((p) => p.client_key === key || p.code === c.id || ('pr-' + p.id) === c.id || String(p.id) === String(c.project_id));
            if (hit) card = hit;
          }
        }
        if (r && r.ok && r.data && r.data.project) card = r.data.project;
      } catch (_) {}
    }
    if (!card) {
      card = {
        client_key: key,
        company: '', tender_no: '', description: '', curator: '', docs_person: '', manager: '',
        members: [],
      };
    }
    activeProjectCard = Object.assign({ client_key: key, chat_id: c && c.id }, card);
    if (key) {
      const ls = readPcardLs();
      ls[key] = Object.assign({}, ls[key] || {}, activeProjectCard);
      writePcardLs(ls);
    }
    fillProjectCardFields(activeProjectCard);
  }

  async function saveProjectCard() {
    if (!activeProjectCard) return;
    const get = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const payload = {
      company: get('pcard-company'),
      tender_no: get('pcard-tender'),
      description: get('pcard-desc'),
      curator: get('pcard-curator'),
      docs_person: get('pcard-docs'),
      manager: get('pcard-manager'),
    };
    Object.assign(activeProjectCard, payload);
    const key = activeProjectCard.client_key || projectKeyForChat(findChat(selectedChat));
    if (key) {
      const ls = readPcardLs();
      ls[key] = Object.assign({}, activeProjectCard, payload, {
        plan_pct: activeProjectCard.plan_pct,
        plan_status: activeProjectCard.plan_status,
        plan_tasks_total: activeProjectCard.plan_tasks_total,
        plan_tasks_done: activeProjectCard.plan_tasks_done,
        plan_tasks_overdue: activeProjectCard.plan_tasks_overdue,
      });
      writePcardLs(ls);
    }
    if (activeProjectCard.id && authToken()) {
      const r = await apiFetch('/api/projects/' + activeProjectCard.id, { method: 'PUT', body: payload });
      if (r.ok && r.data && r.data.project) {
        activeProjectCard = r.data.project;
        fillProjectCardFields(activeProjectCard);
        toast('Карточка сохранена');
        return;
      }
    }
    toast('Карточка сохранена (локально)');
  }

  function openCreateProjectModal(open) {
    const m = document.getElementById('create-project-modal');
    if (!m) return;
    m.classList.toggle('hidden', !open);
  }

  async function populateCreateProjectStaff() {
    const r = await apiFetch('/api/projects/staff');
    const ru = document.getElementById('cp-mgr-ru');
    const cn = document.getElementById('cp-mgr-cn');
    if (!ru || !cn) return;
    const mk = (list) => (list || []).map((u) =>
      '<option value="' + u.id + '">' + escapeHtml((u.display_name || u.username) + ' · ' + (u.role || '')) + '</option>'
    ).join('');
    if (r.ok && r.data) {
      ru.innerHTML = '<option value="">— RU —</option>' + mk(r.data.ru);
      cn.innerHTML = '<option value="">— CN —</option>' + mk(r.data.cn);
    }
  }

  async function submitCreateProject() {
    const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const body = {
      name: val('cp-name'),
      company: val('cp-company'),
      tender_no: val('cp-tender'),
      description: val('cp-desc'),
      curator: val('cp-curator'),
      docs_person: val('cp-docs'),
      manager_ru_id: Number(val('cp-mgr-ru')),
      manager_cn_id: Number(val('cp-mgr-cn')),
    };
    if (!body.name) { toast('Укажите название'); return; }
    if (!body.manager_ru_id || !body.manager_cn_id) { toast('Выберите менеджеров RU и CN'); return; }
    const r = await apiFetch('/api/projects', { method: 'POST', body });
    if (!r.ok) {
      toast((r.data && (r.data.error || r.data.message)) || 'Ошибка создания');
      return;
    }
    const proj = r.data && r.data.project;
    if (proj) {
      const key = proj.client_key || ('pid-' + proj.id);
      const ls = readPcardLs();
      ls[key] = proj;
      writePcardLs(ls);
      CHATS.projects.unshift({
        id: 'pr-srv-' + proj.id,
        serverId: null,
        project_id: proj.id,
        client_key: key,
        name: proj.name,
        role: 'project',
        initials: String(proj.name || 'PR').slice(0, 2).toUpperCase(),
        team: 'pr',
        unread: 0,
      });
      renderChats();
      selectedChat = 'pr-srv-' + proj.id;
      openChatThread(selectedChat);
      setSection('chats');
    }
    openCreateProjectModal(false);
    toast('Проект создан · Генерал добавлен');
    if (typeof loadServerChatsIntoSidebar === 'function') loadServerChatsIntoSidebar();
  }

  // ——— Директор: workload + escalate to Генерал ———
  async function loadDirectorWorkload() {
    const box = document.getElementById('director-workload-list');
    if (!box) return;
    box.textContent = 'Загрузка…';
    const r = await apiFetch('/api/director/workload');
    if (!r.ok) {
      box.innerHTML = '<div class="muted">Нет доступа или ошибка: ' + escapeHtml((r.data && r.data.error) || String(r.status)) + '</div>';
      return;
    }
    const items = (r.data && r.data.items) || [];
    const label = (r.data && r.data.role_label) || 'Директор';
    if (!items.length) {
      box.innerHTML = '<div class="muted">' + escapeHtml(label) + ': нет подчинённых в зоне видимости.</div>';
      return;
    }
    box.innerHTML =
      '<div class="director-row" style="font-size:11px;opacity:.7"><span>Сотрудник</span><span>Открыто</span><span>Просрочено</span><span>План сегодня</span><span></span></div>' +
      items.map((it) => {
        const u = it.user || {};
        const name = u.display_name || u.username || ('#' + u.id);
        const miss = it.missed_plan ? '<span class="miss-badge">пропуск плана</span>' : '';
        const btn = it.missed_plan
          ? '<button type="button" class="btn ghost dir-escalate" data-uid="' + u.id + '" data-name="' + escapeHtml(name) + '">↗ Генералу</button>'
          : '<span class="muted">ок</span>';
        return '<div class="director-row' + (it.missed_plan ? ' missed' : '') + '">' +
          '<div><strong>' + escapeHtml(name) + '</strong> ' + miss +
          '<div class="muted" style="font-size:11px">' + escapeHtml(u.role || '') + (u.region ? ' · ' + escapeHtml(u.region) : '') + '</div></div>' +
          '<span>' + (it.open_tasks || 0) + '</span>' +
          '<span>' + (it.overdue || 0) + '</span>' +
          '<span>' + (it.plan_done_today || 0) + '</span>' +
          '<span>' + btn + '</span></div>';
      }).join('');
    box.querySelectorAll('.dir-escalate').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = Number(btn.getAttribute('data-uid'));
        const name = btn.getAttribute('data-name') || '';
        const er = await apiFetch('/api/director/escalate', {
          method: 'POST',
          body: {
            employee_user_id: uid,
            reason: 'missed_plan',
            plan_title: 'План дня не выполнен',
            detail: 'Сотрудник ' + name + ' не выполнил план. Эскалация от Директора.',
          },
        });
        if (er.ok) toast('Отчёт отправлен Генералу');
        else toast((er.data && (er.data.error || er.data.message)) || 'Ошибка эскалации');
        loadDirectorWorkload();
      });
    });
  }

  function bindProjectAndDirectorUi() {
    const save = document.getElementById('pcard-save');
    if (save) save.addEventListener('click', () => saveProjectCard());
    const createBtn = document.getElementById('btn-create-project');
    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        await populateCreateProjectStaff();
        openCreateProjectModal(true);
      });
    }
    ['cp-close', 'cp-cancel'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => openCreateProjectModal(false));
    });
    const submit = document.getElementById('cp-submit');
    if (submit) submit.addEventListener('click', () => submitCreateProject());
  }

    function initNotifications() {
    bindNotifUi();
    if (typeof bindUpdateUi === 'function') bindUpdateUi();
    if (typeof bindProjectAndDirectorUi === 'function') bindProjectAndDirectorUi();
    if (typeof bindP0Ui === 'function') bindP0Ui();
    if (authToken()) {
      loadNotifications();
      connectNotifWs();
      if (typeof loadServerTasks === 'function') loadServerTasks();
      if (typeof loadReplyStatuses === 'function') loadReplyStatuses();
      if (typeof loadServerChatsIntoSidebar === 'function') loadServerChatsIntoSidebar();
      if (typeof loadMyUsefulnessProfile === 'function') loadMyUsefulnessProfile();
    }
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
