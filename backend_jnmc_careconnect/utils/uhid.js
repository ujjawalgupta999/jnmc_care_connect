async function generateUniqueUHID(model) {
  let uhid;
  let exists = true;

  while (exists) {
    // generate 14-digit numeric stringg
    uhid = Math.floor(
      10000000000000 + Math.random() * 90000000000000,
    ).toString();

    exists = await model.exists({ uhid });
  }

  return uhid;
}

module.exports = { generateUniqueUHID };
