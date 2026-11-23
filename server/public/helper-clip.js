'use strict';

/**
 * On-screen helper tips. No network. Suggestions name controls that exist
 * on that section. Unknown sections get a short pointer to the open screen,
 * not a general manual.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GililHelper = api;
})(typeof window !== 'undefined' ? window : null, function () {
  const COPY = {
    ru: {
      title: 'Скрепка',
      close: 'Закрыть подсказку',
      open: 'Подсказка по этому экрану',
      chats: {
        lead: 'Сейчас открыты проекты и переписка.',
        steps: [
          'Слева выберите команду или оставьте «Обе команды».',
          'Откройте диалог в списке.',
          'Напишите сообщение и нажмите отправку.',
        ],
      },
      personal: {
        lead: 'Сейчас открыт раздел «Личная».',
        steps: [
          'В карточке «Кто я» нажмите шестерёнку, чтобы изменить имя и компанию.',
          'Роль, команда и логин в этой карточке не редактируются.',
          'Ниже отметьте пункты плана на сегодня.',
        ],
      },
      mail: {
        lead: 'Сейчас открыта почта.',
        steps: [
          'Выберите письмо в списке.',
          'Ответ пишется в открытом письме.',
        ],
      },
      calendar: {
        lead: 'Сейчас открыт календарь.',
        steps: ['Выберите день, чтобы увидеть записи на эту дату.'],
      },
      'tasks-plans': {
        lead: 'Сейчас открыты задачи и планы.',
        steps: ['Откройте задачу в таблице и обновите её статус.'],
      },
      news: {
        lead: 'Сейчас открыты новости.',
        steps: ['Прочитайте ленту. Новая новость создаётся формой на этом экране, если она вам доступна.'],
      },
      supply: {
        lead: 'Сейчас открыт Gilil Supply.',
        steps: ['Работа идёт во встроенном окне Supply. Кнопка «Обновить» перезагружает только это окно.'],
      },
      crm: {
        lead: 'Сейчас открыта CRM.',
        steps: ['Выберите карточку в списке CRM и откройте её поля.'],
      },
      leads: {
        lead: 'Сейчас открыты заявки.',
        steps: ['Откройте заявку в списке, чтобы увидеть её данные.'],
      },
      tenders: {
        lead: 'Сейчас открыты тендеры.',
        steps: ['Выберите тендер в списке этого раздела.'],
      },
      storage: {
        lead: 'Сейчас открыто хранилище.',
        steps: ['Откройте папку или файл в списке хранилища.'],
      },
      tv: {
        lead: 'Сейчас открыта воронка ТВ.',
        steps: ['Смотрите доску воронки на этом экране.'],
      },
      funnel: {
        lead: 'Сейчас открыта воронка заказа.',
        steps: ['Этапы заказа показаны на этой странице.'],
      },
      'mail-stats': {
        lead: 'Сейчас открыта статистика почты.',
        steps: ['Цифры на экране считаются по уже загруженной почте.'],
      },
      usefulness: {
        lead: 'Сейчас открыта полезность.',
        steps: ['Оценка на этом экране относится к текущему профилю.'],
      },
      director: {
        lead: 'Сейчас открыта нагрузка директора.',
        steps: ['Список показывает план подчинённых. Эскалация доступна, только если пункт плана пропущен.'],
      },
      activity: {
        lead: 'Сейчас открыт журнал.',
        steps: ['Журнал показывает уже записанные действия. Новые записи сами появляются из работы в программе.'],
      },
    },
  };

  COPY.en = {
    title: 'Paperclip',
    close: 'Close the tip',
    open: 'Tip for this screen',
    chats: {
      lead: 'Projects and conversations are open.',
      steps: [
        'On the left, pick a team or keep both teams.',
        'Open a conversation in the list.',
        'Write a message and send it.',
      ],
    },
    personal: {
      lead: 'The Personal section is open.',
      steps: [
        'On the Who card, use the gear to change the name and company.',
        'Role, team and login on that card stay read-only.',
        'Below, check today’s plan items.',
      ],
    },
    mail: {
      lead: 'Mail is open.',
      steps: ['Select a message in the list.', 'A reply is written in the open message.'],
    },
    calendar: {
      lead: 'The calendar is open.',
      steps: ['Pick a day to see what is listed for that date.'],
    },
    'tasks-plans': {
      lead: 'Tasks and plans are open.',
      steps: ['Open a task in the table and update its status.'],
    },
    news: {
      lead: 'News is open.',
      steps: ['Read the feed. A new article uses the form on this screen when you can post.'],
    },
    supply: {
      lead: 'Gilil Supply is open.',
      steps: ['Work continues in the embedded Supply window. Reload refreshes only that window.'],
    },
    crm: {
      lead: 'CRM is open.',
      steps: ['Select a CRM card in the list and open its fields.'],
    },
    leads: {
      lead: 'Leads are open.',
      steps: ['Open a lead in the list to see its details.'],
    },
    tenders: {
      lead: 'Tenders are open.',
      steps: ['Select a tender in this section’s list.'],
    },
    storage: {
      lead: 'Storage is open.',
      steps: ['Open a folder or file in the storage list.'],
    },
    tv: {
      lead: 'The TV funnel is open.',
      steps: ['Read the funnel board on this screen.'],
    },
    funnel: {
      lead: 'The order funnel is open.',
      steps: ['Order stages are shown on this page.'],
    },
    'mail-stats': {
      lead: 'Mail statistics are open.',
      steps: ['The figures come from mail already loaded in the app.'],
    },
    usefulness: {
      lead: 'Usefulness is open.',
      steps: ['The score on this screen belongs to the current profile.'],
    },
    director: {
      lead: 'Director workload is open.',
      steps: ['The list shows the team plan. Escalation is available only when a plan item was missed.'],
    },
    activity: {
      lead: 'The activity journal is open.',
      steps: ['The journal lists actions already recorded. New rows come from work in the app.'],
    },
  };

  COPY.zh = {
    title: '回形针',
    close: '关闭提示',
    open: '当前屏幕提示',
    chats: {
      lead: '当前是项目和对话。',
      steps: ['在左侧选择团队，或保留两个团队。', '在列表中打开对话。', '写下消息并发送。'],
    },
    personal: {
      lead: '当前是个人页。',
      steps: ['在「我是谁」卡片上点齿轮，可修改姓名和公司。', '角色、团队和登录名不能在这里修改。', '在下面勾选今天的计划。'],
    },
    mail: {
      lead: '当前是邮件。',
      steps: ['在列表中选择一封邮件。', '回复写在打开的邮件里。'],
    },
    calendar: { lead: '当前是日历。', steps: ['选择一天，查看这一天的记录。'] },
    'tasks-plans': { lead: '当前是任务和计划。', steps: ['在表中打开任务并更新状态。'] },
    news: { lead: '当前是新闻。', steps: ['阅读列表。若你可以发布，使用本屏上的表单。'] },
    supply: { lead: '当前是 Gilil Supply。', steps: ['工作在内嵌的 Supply 窗口中。刷新只重新加载这个窗口。'] },
    crm: { lead: '当前是 CRM。', steps: ['在列表中选择一张卡片并打开字段。'] },
    leads: { lead: '当前是申请。', steps: ['打开列表中的申请以查看内容。'] },
    tenders: { lead: '当前是招标。', steps: ['在本区列表中选择一项招标。'] },
    storage: { lead: '当前是存储。', steps: ['在存储列表中打开文件夹或文件。'] },
    tv: { lead: '当前是电视漏斗。', steps: ['查看本屏上的漏斗板。'] },
    funnel: { lead: '当前是订单漏斗。', steps: ['订单阶段显示在这一页。'] },
    'mail-stats': { lead: '当前是邮件统计。', steps: ['数字来自程序里已经载入的邮件。'] },
    usefulness: { lead: '当前是贡献。', steps: ['本屏上的评价属于当前资料。'] },
    director: { lead: '当前是总监负荷。', steps: ['列表显示下属计划。只有错过计划时才能升级。'] },
    activity: { lead: '当前是日志。', steps: ['日志显示已经记录的操作。新记录来自程序中的工作。'] },
  };

  function suggestions(section, lang) {
    const pack = COPY[lang] || COPY.ru;
    const block = pack[section] || pack.chats;
    return {
      title: pack.title,
      close: pack.close,
      open: pack.open,
      lead: block.lead,
      steps: block.steps.slice(),
    };
  }

  return { suggestions: suggestions };
});
