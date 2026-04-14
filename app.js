const STORAGE_KEY = "culture-center-portal-v2";
const SHARE_PARAM = "share";
const initialState = {
  groupName: "Студия творчества",
  teacherName: "Руководитель группы",
  remarks: "",
  annualReport: "",
  planItems: [],
  students: [
    { id: crypto.randomUUID(), name: "Иванова Мария", parentName: "Ольга Иванова", parentContact: "8 900 000 00 01" },
    { id: crypto.randomUUID(), name: "Петров Артем", parentName: "Наталья Петрова", parentContact: "8 900 000 00 02" },
  ],
  lessons: [],
  activeLessonId: null,
};

const state = loadState();
ensureDemoLesson();
ensureAttendanceShape();

const elements = {
  teacherApp: document.getElementById("teacherApp"),
  viewerApp: document.getElementById("viewerApp"),
  appEyebrow: document.getElementById("appEyebrow"),
  appTitle: document.getElementById("appTitle"),
  appLead: document.getElementById("appLead"),
  teacherHeaderActions: document.getElementById("teacherHeaderActions"),
  groupForm: document.getElementById("groupForm"),
  groupName: document.getElementById("groupName"),
  teacherName: document.getElementById("teacherName"),
  studentList: document.getElementById("studentList"),
  studentCount: document.getElementById("studentCount"),
  studentForm: document.getElementById("studentForm"),
  studentName: document.getElementById("studentName"),
  parentName: document.getElementById("parentName"),
  parentContact: document.getElementById("parentContact"),
  addLessonBtn: document.getElementById("addLessonBtn"),
  exportBtn: document.getElementById("exportBtn"),
  lessonTabs: document.getElementById("lessonTabs"),
  lessonCount: document.getElementById("lessonCount"),
  emptyState: document.getElementById("emptyState"),
  lessonWorkspace: document.getElementById("lessonWorkspace"),
  lessonGroupMeta: document.getElementById("lessonGroupMeta"),
  workspaceTitle: document.getElementById("workspaceTitle"),
  deleteLessonBtn: document.getElementById("deleteLessonBtn"),
  lessonDate: document.getElementById("lessonDate"),
  lessonTime: document.getElementById("lessonTime"),
  lessonTopic: document.getElementById("lessonTopic"),
  lessonSummary: document.getElementById("lessonSummary"),
  lessonHomework: document.getElementById("lessonHomework"),
  attendanceList: document.getElementById("attendanceList"),
  attendanceSummary: document.getElementById("attendanceSummary"),
  shareStudentSelect: document.getElementById("shareStudentSelect"),
  copyParentLinkBtn: document.getElementById("copyParentLinkBtn"),
  copyStudentLinkBtn: document.getElementById("copyStudentLinkBtn"),
  shareWhatsAppBtn: document.getElementById("shareWhatsAppBtn"),
  shareStatus: document.getElementById("shareStatus"),
  planList: document.getElementById("planList"),
  planCount: document.getElementById("planCount"),
  planForm: document.getElementById("planForm"),
  planContent: document.getElementById("planContent"),
  planDate: document.getElementById("planDate"),
  planResponsible: document.getElementById("planResponsible"),
  attendanceJournal: document.getElementById("attendanceJournal"),
  remarksInput: document.getElementById("remarksInput"),
  annualReportInput: document.getElementById("annualReportInput"),
  viewerEyebrow: document.getElementById("viewerEyebrow"),
  viewerStudentName: document.getElementById("viewerStudentName"),
  viewerSummary: document.getElementById("viewerSummary"),
  viewerActions: document.getElementById("viewerActions"),
  viewerAttendanceRate: document.getElementById("viewerAttendanceRate"),
  viewerAttendanceStats: document.getElementById("viewerAttendanceStats"),
  viewerLatestHomework: document.getElementById("viewerLatestHomework"),
  viewerLessons: document.getElementById("viewerLessons"),
};

const templates = {
  lessonTab: document.getElementById("lessonTabTemplate"),
  attendanceItem: document.getElementById("attendanceItemTemplate"),
  studentCard: document.getElementById("studentCardTemplate"),
  viewerLesson: document.getElementById("viewerLessonTemplate"),
  planItem: document.getElementById("planItemTemplate"),
};

const sharePayload = readSharePayload();
if (sharePayload) {
  renderViewer(sharePayload);
} else {
  bindTeacherEvents();
  renderTeacher();
}

function bindTeacherEvents() {
  elements.groupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.groupName = elements.groupName.value.trim() || "Без названия";
    state.teacherName = elements.teacherName.value.trim() || "Руководитель группы";
    persistAndRenderTeacher();
  });

  elements.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = elements.studentName.value.trim();
    if (!name) return;

    state.students.push({
      id: crypto.randomUUID(),
      name,
      parentName: elements.parentName.value.trim(),
      parentContact: elements.parentContact.value.trim(),
    });

    elements.studentForm.reset();
    ensureAttendanceShape();
    persistAndRenderTeacher();
  });

  elements.addLessonBtn.addEventListener("click", () => {
    const lesson = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      time: "16:00",
      topic: `Занятие ${state.lessons.length + 1}`,
      summary: "",
      homework: "",
      attendance: Object.fromEntries(state.students.map((student) => [student.id, false])),
    };
    state.lessons.unshift(lesson);
    state.activeLessonId = lesson.id;
    persistAndRenderTeacher();
  });

  elements.exportBtn.addEventListener("click", exportCsv);
  elements.deleteLessonBtn.addEventListener("click", deleteActiveLesson);
  elements.planForm.addEventListener("submit", addPlanItem);
  [elements.lessonDate, elements.lessonTime, elements.lessonTopic, elements.lessonSummary, elements.lessonHomework]
    .forEach((field) => field.addEventListener("input", updateActiveLessonFromForm));
  [elements.remarksInput, elements.annualReportInput].forEach((field) => {
    field.addEventListener("input", updateJournalNotes);
  });
  elements.copyParentLinkBtn.addEventListener("click", () => copyShareLink("parent"));
  elements.copyStudentLinkBtn.addEventListener("click", () => copyShareLink("student"));
  elements.shareWhatsAppBtn.addEventListener("click", shareViaWhatsApp);
}

function renderTeacher() {
  elements.viewerApp.classList.add("hidden");
  elements.teacherApp.classList.remove("hidden");
  elements.teacherHeaderActions.classList.remove("hidden");
  elements.appEyebrow.textContent = "Рабочий кабинет";
  elements.appTitle.textContent = "Журнал кружка для тебя, детей и родителей";
  elements.appLead.textContent = "Ты заполняешь занятие один раз, а потом отправляешь личную ссылку ребенку или родителю.";
  elements.groupName.value = state.groupName;
  elements.teacherName.value = state.teacherName;
  elements.remarksInput.value = state.remarks || "";
  elements.annualReportInput.value = state.annualReport || "";
  renderStudentList();
  renderPlanItems();
  renderLessonTabs();
  renderLessonWorkspace();
  renderAttendanceJournal();
  renderShareStudentSelect();
}

function renderStudentList() {
  elements.studentList.innerHTML = "";
  elements.studentCount.textContent = `${state.students.length} детей`;
  if (!state.students.length) {
    appendNote(elements.studentList, "Добавь хотя бы одного ребенка, чтобы отмечать посещаемость.");
    return;
  }

  state.students.forEach((student) => {
    const card = templates.studentCard.content.firstElementChild.cloneNode(true);
    card.querySelector(".student-name").textContent = student.name;
    card.querySelector(".student-meta").textContent =
      [student.parentName, student.parentContact].filter(Boolean).join(" • ") || "Контакт пока не указан";
    card.querySelector(".mini-link").addEventListener("click", () => removeStudent(student.id));
    elements.studentList.append(card);
  });
}

function renderLessonTabs() {
  elements.lessonTabs.innerHTML = "";
  elements.lessonCount.textContent = `${state.lessons.length} занятий`;
  if (!state.lessons.length) {
    appendNote(elements.lessonTabs, "Пока нет занятий. Нажми «Новое занятие».");
    return;
  }

  sortedLessons().forEach((lesson) => {
    const button = templates.lessonTab.content.firstElementChild.cloneNode(true);
    button.classList.toggle("active", lesson.id === state.activeLessonId);
    button.innerHTML = `
      <strong>${escapeHtml(lesson.topic || "Без темы")}</strong>
      <small class="student-meta">${formatDateTime(lesson.date, lesson.time)}</small>
    `;
    button.addEventListener("click", () => {
      state.activeLessonId = lesson.id;
      saveState();
      renderTeacher();
    });
    elements.lessonTabs.append(button);
  });
}

function renderPlanItems() {
  elements.planList.innerHTML = "";
  elements.planCount.textContent = `${state.planItems.length} записей`;
  if (!state.planItems.length) {
    appendNote(elements.planList, "Здесь будет электронный план работы, как в бумажном журнале.");
    return;
  }

  state.planItems
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .forEach((item) => {
      const row = templates.planItem.content.firstElementChild.cloneNode(true);
      row.querySelector(".plan-item-content").textContent = item.content;
      row.querySelector(".plan-item-meta").textContent =
        [item.date ? formatDateTime(item.date, "") : "", item.responsible].filter(Boolean).join(" • ");
      row.querySelector(".mini-link").addEventListener("click", () => removePlanItem(item.id));
      elements.planList.append(row);
    });
}

function renderLessonWorkspace() {
  const lesson = getActiveLesson();
  elements.emptyState.classList.toggle("hidden", Boolean(lesson));
  elements.lessonWorkspace.classList.toggle("hidden", !lesson);
  if (!lesson) return;

  elements.lessonGroupMeta.textContent = `${state.groupName} • ${state.teacherName}`;
  elements.workspaceTitle.textContent = lesson.topic || "Без темы";
  elements.lessonDate.value = lesson.date || "";
  elements.lessonTime.value = lesson.time || "";
  elements.lessonTopic.value = lesson.topic || "";
  elements.lessonSummary.value = lesson.summary || "";
  elements.lessonHomework.value = lesson.homework || "";
  renderAttendanceList(lesson);
}

function renderAttendanceList(lesson) {
  elements.attendanceList.innerHTML = "";
  const presentCount = state.students.filter((student) => lesson.attendance[student.id]).length;
  elements.attendanceSummary.textContent = `${presentCount} из ${state.students.length}`;

  if (!state.students.length) {
    appendNote(elements.attendanceList, "Сначала добавь детей в список слева.");
    return;
  }

  state.students.forEach((student) => {
    const row = templates.attendanceItem.content.firstElementChild.cloneNode(true);
    const checkbox = row.querySelector("input");
    row.querySelector(".attendance-name").textContent = student.name;
    row.querySelector(".attendance-extra").textContent =
      student.parentName ? `Родитель: ${student.parentName}` : "Родитель не указан";
    checkbox.checked = Boolean(lesson.attendance[student.id]);
    checkbox.addEventListener("change", () => {
      lesson.attendance[student.id] = checkbox.checked;
      saveState();
      renderAttendanceList(lesson);
    });
    elements.attendanceList.append(row);
  });
}

function renderShareStudentSelect() {
  elements.shareStudentSelect.innerHTML = "";
  if (!state.students.length) {
    const option = document.createElement("option");
    option.textContent = "Нет детей в списке";
    elements.shareStudentSelect.append(option);
    elements.copyParentLinkBtn.disabled = true;
    elements.copyStudentLinkBtn.disabled = true;
    return;
  }

  state.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = student.name;
    elements.shareStudentSelect.append(option);
  });
  elements.copyParentLinkBtn.disabled = false;
  elements.copyStudentLinkBtn.disabled = false;
}

function renderAttendanceJournal() {
  elements.attendanceJournal.innerHTML = "";
  if (!state.students.length) {
    appendNote(elements.attendanceJournal, "После добавления детей здесь появится сводка по посещаемости.");
    return;
  }

  state.students.forEach((student) => {
    const lessons = sortedLessons();
    const presentDates = lessons
      .filter((lesson) => lesson.attendance?.[student.id])
      .map((lesson) => formatDateTime(lesson.date, lesson.time));
    const row = document.createElement("article");
    row.className = "attendance-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(student.name)}</strong>
        <div class="attendance-dates">${presentDates.length ? presentDates.join(", ") : "Пока нет отмеченных посещений"}</div>
      </div>
      <span class="pill">${presentDates.length} из ${lessons.length}</span>
    `;
    elements.attendanceJournal.append(row);
  });
}

function renderViewer(payload) {
  elements.teacherApp.classList.add("hidden");
  elements.teacherHeaderActions.classList.add("hidden");
  elements.viewerApp.classList.remove("hidden");

  const student = payload.students.find((item) => item.id === payload.studentId);
  const lessons = payload.lessons.slice().sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  if (!student) {
    elements.appEyebrow.textContent = "Доступ по ссылке";
    elements.appTitle.textContent = "Ссылка устарела";
    elements.appLead.textContent = "Попросите у руководителя новую ссылку.";
    elements.viewerEyebrow.textContent = "Просмотр недоступен";
    elements.viewerStudentName.textContent = "Ученик не найден";
    elements.viewerSummary.textContent = "Эту ссылку нужно обновить.";
    return;
  }

  const presentLessons = lessons.filter((lesson) => lesson.attendance?.[student.id]).length;
  const attendanceRate = lessons.length ? Math.round((presentLessons / lessons.length) * 100) : 0;
  const latestHomeworkLesson = lessons.find((lesson) => lesson.homework?.trim());

  elements.appEyebrow.textContent = payload.viewMode === "parent" ? "Ссылка для родителя" : "Ссылка для ребенка";
  elements.appTitle.textContent = payload.groupName;
  elements.appLead.textContent = `Просмотр по персональной ссылке. Данные подготовил ${payload.teacherName}.`;
  elements.viewerEyebrow.textContent = payload.viewMode === "parent" ? "Личный кабинет родителя" : "Личный кабинет ученика";
  elements.viewerStudentName.textContent = student.name;
  elements.viewerSummary.textContent = `${payload.groupName} • ${payload.teacherName}`;
  elements.viewerAttendanceRate.textContent = `${attendanceRate}% посещаемости`;
  renderViewerActions(payload, student, latestHomeworkLesson);

  elements.viewerAttendanceStats.innerHTML = "";
  [
    ["Всего занятий", lessons.length],
    ["Был на занятиях", presentLessons],
    ["Пропусков", Math.max(lessons.length - presentLessons, 0)],
  ].forEach(([title, value]) => {
    const block = document.createElement("div");
    block.className = "info-block";
    block.innerHTML = `<strong>${value}</strong><p>${title}</p>`;
    elements.viewerAttendanceStats.append(block);
  });

  if (latestHomeworkLesson) {
    elements.viewerLatestHomework.innerHTML = `
      <p class="viewer-date">${formatDateTime(latestHomeworkLesson.date, latestHomeworkLesson.time)}</p>
      <h4>${escapeHtml(latestHomeworkLesson.topic || "Без темы")}</h4>
      <div class="homework-box">${toHtml(latestHomeworkLesson.homework)}</div>
    `;
  } else {
    elements.viewerLatestHomework.textContent = "Домашнее задание пока не добавлено.";
  }

  elements.viewerLessons.innerHTML = "";
  if (!lessons.length) {
    appendNote(elements.viewerLessons, "Пока нет занятий для отображения.");
    return;
  }

  lessons.forEach((lesson) => {
    const article = templates.viewerLesson.content.firstElementChild.cloneNode(true);
    article.querySelector(".viewer-date").textContent = formatDateTime(lesson.date, lesson.time);
    article.querySelector(".viewer-topic").textContent = lesson.topic || "Без темы";
    article.querySelector(".viewer-badge").textContent = lesson.attendance?.[student.id] ? "Присутствовал" : "Отсутствовал";
    article.querySelector(".viewer-summary").textContent = lesson.summary || "Описание занятия пока не добавлено.";
    article.querySelector(".homework-box").innerHTML = lesson.homework ? toHtml(lesson.homework) : "Домашнее задание не указано.";
    elements.viewerLessons.append(article);
  });
}

function updateActiveLessonFromForm() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  lesson.date = elements.lessonDate.value;
  lesson.time = elements.lessonTime.value;
  lesson.topic = elements.lessonTopic.value.trim() || "Без темы";
  lesson.summary = elements.lessonSummary.value.trim();
  lesson.homework = elements.lessonHomework.value.trim();
  saveState();
  renderLessonTabs();
  renderLessonWorkspace();
  renderAttendanceJournal();
}

function updateJournalNotes() {
  state.remarks = elements.remarksInput.value.trim();
  state.annualReport = elements.annualReportInput.value.trim();
  saveState();
}

function copyShareLink(viewMode) {
  const studentId = elements.shareStudentSelect.value;
  const payload = {
    viewMode,
    groupName: state.groupName,
    teacherName: state.teacherName,
    students: state.students,
    lessons: state.lessons,
    studentId,
    exportedAt: new Date().toISOString(),
  };
  const url = new URL(window.location.href);
  url.searchParams.set(SHARE_PARAM, encodeSharePayload(payload));

  navigator.clipboard.writeText(url.toString())
    .then(() => {
      const student = state.students.find((item) => item.id === studentId);
      const label = viewMode === "parent" ? "родителя" : "ребенка";
      elements.shareStatus.textContent = `Ссылка для ${label} по ученику "${student?.name || ""}" скопирована.`;
    })
    .catch(() => {
      elements.shareStatus.textContent = "Не получилось скопировать автоматически.";
    });
}

function shareViaWhatsApp() {
  const studentId = elements.shareStudentSelect.value;
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return;

  const payload = {
    viewMode: "parent",
    groupName: state.groupName,
    teacherName: state.teacherName,
    students: state.students,
    lessons: state.lessons,
    studentId,
    exportedAt: new Date().toISOString(),
  };

  const latestLesson = sortedLessons()[0];
  const url = new URL(window.location.href);
  url.searchParams.set(SHARE_PARAM, encodeSharePayload(payload));

  const message = [
    `Здравствуйте!`,
    `Направляю ссылку по занятиям ребенка: ${student.name}.`,
    latestLesson ? `Последняя тема: ${latestLesson.topic || "Без темы"}.` : "",
    latestLesson?.homework ? `Домашнее задание: ${latestLesson.homework}` : "",
    url.toString(),
  ].filter(Boolean).join("\n");

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener");
  elements.shareStatus.textContent = `Подготовлено сообщение WhatsApp для родителя ученика "${student.name}".`;
}

function exportCsv() {
  const rows = [["Группа", "Педагог", "Дата", "Время", "Тема", "Ребенок", "Родитель", "Присутствовал", "Домашнее задание"]];
  sortedLessons().forEach((lesson) => {
    state.students.forEach((student) => {
      rows.push([
        state.groupName,
        state.teacherName,
        lesson.date,
        lesson.time,
        lesson.topic,
        student.name,
        student.parentName,
        lesson.attendance?.[student.id] ? "Да" : "Нет",
        lesson.homework,
      ]);
    });
  });

  const csv = rows.map((row) => row.map((item) => `"${String(item ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "journal-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function addPlanItem(event) {
  event.preventDefault();
  const content = elements.planContent.value.trim();
  if (!content) return;
  state.planItems.push({
    id: crypto.randomUUID(),
    content,
    date: elements.planDate.value,
    responsible: elements.planResponsible.value.trim(),
  });
  elements.planForm.reset();
  saveState();
  renderPlanItems();
}

function deleteActiveLesson() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const confirmed = window.confirm(`Удалить занятие "${lesson.topic || "Без темы"}"?`);
  if (!confirmed) return;
  state.lessons = state.lessons.filter((item) => item.id !== lesson.id);
  state.activeLessonId = state.lessons[0]?.id ?? null;
  persistAndRenderTeacher();
}

function removeStudent(studentId) {
  const student = state.students.find((item) => item.id === studentId);
  const confirmed = window.confirm(`Удалить "${student?.name || "ребенка"}" из списка?`);
  if (!confirmed) return;
  state.students = state.students.filter((item) => item.id !== studentId);
  state.lessons.forEach((lesson) => delete lesson.attendance[studentId]);
  persistAndRenderTeacher();
}

function removePlanItem(planId) {
  state.planItems = state.planItems.filter((item) => item.id !== planId);
  saveState();
  renderPlanItems();
}

function ensureAttendanceShape() {
  state.lessons.forEach((lesson) => {
    const nextAttendance = {};
    state.students.forEach((student) => {
      nextAttendance[student.id] = Boolean(lesson.attendance?.[student.id]);
    });
    lesson.attendance = nextAttendance;
  });
}

function ensureDemoLesson() {
  if (state.lessons.length) {
    if (!state.activeLessonId) state.activeLessonId = state.lessons[0].id;
    saveState();
    return;
  }

  state.lessons.push({
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    time: "16:00",
    topic: "Подготовка к творческому номеру",
    summary: "Разбирали материал, повторяли движения и распределяли роли.",
    homework: "Повторить текст и принести реквизит к следующему занятию.",
    attendance: Object.fromEntries(state.students.map((student) => [student.id, true])),
  });
  state.activeLessonId = state.lessons[0].id;
  saveState();
}

function getActiveLesson() {
  return state.lessons.find((lesson) => lesson.id === state.activeLessonId) ?? null;
}

function sortedLessons() {
  return state.lessons.slice().sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

function persistAndRenderTeacher() {
  ensureAttendanceShape();
  saveState();
  renderTeacher();
}

function appendNote(container, text) {
  const note = document.createElement("p");
  note.className = "hint";
  note.textContent = text;
  container.append(note);
}

function renderViewerActions(payload, student, latestHomeworkLesson) {
  elements.viewerActions.innerHTML = "";
  const actions = [];

  if (latestHomeworkLesson?.homework) {
    actions.push({
      label: "Последнее ДЗ",
      href: "#viewerLatestHomework",
    });
  }

  const parentPhone = normalizePhone(student.parentContact);
  if (payload.viewMode === "parent" && parentPhone) {
    actions.push({
      label: "Позвонить",
      href: `tel:${parentPhone}`,
    });
  }

  actions.push({
    label: "История занятий",
    href: "#viewerLessons",
  });

  actions.forEach((action) => {
    const link = document.createElement("a");
    link.className = "viewer-action";
    link.href = action.href;
    link.textContent = action.label;
    elements.viewerActions.append(link);
  });
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(initialState);
  try {
    return { ...structuredClone(initialState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDateTime(date, time) {
  if (!date) return time || "Дата не указана";
  const value = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(value.getTime())) return [date, time].filter(Boolean).join(" ");
  return value.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toHtml(text) {
  return escapeHtml(text).replaceAll("\n", "<br>");
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits || "";
}

function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ".");
}

function decodeSharePayload(raw) {
  const normalized = raw.replaceAll("-", "+").replaceAll("_", "/").replaceAll(".", "=");
  const json = decodeURIComponent(escape(atob(normalized)));
  return JSON.parse(json);
}

function readSharePayload() {
  const url = new URL(window.location.href);
  const share = url.searchParams.get(SHARE_PARAM);
  if (!share) return null;
  try {
    return decodeSharePayload(share);
  } catch {
    return null;
  }
}
