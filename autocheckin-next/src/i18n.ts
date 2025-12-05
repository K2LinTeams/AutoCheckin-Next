import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Tasks": "Tasks",
      "Map": "Map",
      "Settings": "Settings",
      "Logs": "Logs",
      "Add Task": "Add Task",
      "Login": "Login",
      "Get QR Code": "Get QR Code",
      "Scan the QR code to login": "Scan the QR code to login",
      "Logged in as": "Logged in as",
      "Class ID": "Class ID",
      "Name": "Name",
      "Time": "Time",
      "Status": "Status",
      "Actions": "Actions",
      "Edit": "Edit",
      "Delete": "Delete",
      "Save": "Save",
      "Cancel": "Cancel",
      "Latitude": "Latitude",
      "Longitude": "Longitude",
      "WeCom Settings": "WeCom Settings",
      "Enable": "Enable",
      "CorpID": "CorpID",
      "Secret": "Secret",
      "AgentID": "AgentID",
      "ToUser": "ToUser",
    }
  },
  zh: {
    translation: {
      "Tasks": "任务列表",
      "Map": "地图选点",
      "Settings": "全局设置",
      "Logs": "日志",
      "Add Task": "添加任务",
      "Login": "登录",
      "Get QR Code": "获取二维码",
      "Scan the QR code to login": "请扫描二维码登录",
      "Logged in as": "已登录用户",
      "Class ID": "班级ID",
      "Name": "任务名称",
      "Time": "执行时间",
      "Status": "状态",
      "Actions": "操作",
      "Edit": "编辑",
      "Delete": "删除",
      "Save": "保存",
      "Cancel": "取消",
      "Latitude": "纬度",
      "Longitude": "经度",
      "WeCom Settings": "企业微信设置",
      "Enable": "启用",
      "CorpID": "企业ID",
      "Secret": "应用密钥",
      "AgentID": "应用ID",
      "ToUser": "接收人",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "zh",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
