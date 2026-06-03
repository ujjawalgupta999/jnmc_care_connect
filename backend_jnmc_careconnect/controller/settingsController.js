const Setting = require("../models/Setting");

const getSettings = async (req, res) => {
  try {
    const { category, key } = req.query;
    let query = {};

    if (category) query.category = category;
    if (key) query.key = key;

    const settings = await Setting.find(query);

    // Convert to key-value object for easier frontend usage
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      settings: settingsMap,
      raw: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, category } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Value is required",
      });
    }

    let setting = await Setting.findOne({ key });

    if (setting) {
      setting.value = value;
      if (description !== undefined) setting.description = description;
      if (category !== undefined) setting.category = category;
      await setting.save();
    } else {
      setting = await Setting.create({
        key,
        value,
        description: description || "",
        category: category || "general",
      });
    }

    res.status(200).json({
      success: true,
      message: `Setting '${key}' updated successfully`,
      setting,
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update setting",
      error: error.message,
    });
  }
};

const getHospitalCharges = async (req, res) => {
  try {
    const chargesSetting = await Setting.findOne({ key: "hospital_charges" });
    const charges = chargesSetting ? chargesSetting.value : { baseCharge: 15, isConfigurable: true };

    res.status(200).json({
      success: true,
      charges,
    });
  } catch (error) {
    console.error("Error fetching hospital charges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hospital charges",
      error: error.message,
    });
  }
};

const updateHospitalCharges = async (req, res) => {
  try {
    const { baseCharge, categoryCharges, isConfigurable } = req.body;

    if (baseCharge === undefined) {
      return res.status(400).json({
        success: false,
        message: "baseCharge is required",
      });
    }

    const chargesValue = {
      baseCharge: Number(baseCharge),
      categoryCharges: categoryCharges || {},
      isConfigurable: isConfigurable !== undefined ? isConfigurable : true,
      updatedAt: new Date(),
    };

    let setting = await Setting.findOne({ key: "hospital_charges" });

    if (setting) {
      setting.value = chargesValue;
      await setting.save();
    } else {
      setting = await Setting.create({
        key: "hospital_charges",
        value: chargesValue,
        description: "Hospital base charges for lab test bookings",
        category: "billing",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hospital charges updated successfully",
      charges: chargesValue,
    });
  } catch (error) {
    console.error("Error updating hospital charges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update hospital charges",
      error: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSetting,
  getHospitalCharges,
  updateHospitalCharges,
};
