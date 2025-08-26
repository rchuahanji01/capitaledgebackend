const listAllSettings = require('./listAllSettings');

const loadSettings = async () => {
  const allSettings = {};
  const datas = await listAllSettings();
  console.log('datas>>' , datas)
  datas.forEach(({ settingKey, settingValue }) => {
    allSettings[settingKey] = settingValue;
  });
  console.log("allSettings>>>>>" , allSettings)
  return allSettings;
};

module.exports = loadSettings;
