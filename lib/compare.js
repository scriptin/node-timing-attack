async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function compareStringsSlowly(s1, s2) {
  const l1 = s1.length, l2 = s2.length;
  if (l1 !== l2) {
    return false;
  }
  await sleep(1);
  let i = 0, c1 = 0, c2 = 0;
  while (i < l1) {
    c1 = s1.charCodeAt(i);
    c2 = s2.charCodeAt(i);
    if (c1 !== c2) break;
    await sleep(1);
    i++;
  }
  return i === l1;
}

module.exports = { compareStringsSlowly };
