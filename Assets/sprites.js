"use strict";

const PixelArt = (() => {
  const outlines = {
    frog: [
      "....KK....KK....", "...KGGK..KGGK...", "..KGYYK..KYYGK..", "..KGYKGGGGKYGK..",
      "..KGGGGGGGGGGK..", ".KGGGLLLGLLGGGK.", ".KGGGGGGGGGGGGK.", ".KGGKGGGGGGKGGK.",
      "..KGGKKKKKKGGK..", "..KGGEEEEEEGGK..", "...KKGGGGGGKK...", "..KGGKGGGGKGGK..",
      ".KGGKKGGGGKKGGK.", "KLGK.KKKKKK.KGLK", "KKK..........KKK", "................"
    ],
    bat: [
      ".....K....K.....", "....KMK..KMK....", "....KMMKKMMK....", "...KMMDDDDMMK...",
      "K..KDDDDDDDDK..K", "KKKDDYDDDYDDKKKK", "KMKDDYDDDYDDKMMK", "KMMKDDDLDKDKMMMK",
      "KMMMKDKKKDKMMMDK", "KDMMDKWWKDMMDMDK", ".KDMMDKKDMMDMDK.", "..KKDMDDMDDKK...",
      "...KDKDDDKK.....", "....KKDDKK......", ".....K..K.......", "................"
    ],
    ghost: [
      ".....KKKKKK.....", "...KKMMMMMMKK...", "..KMLLLLLLMMMK..", ".KMLLLLLLMMMMMK.",
      ".KMLLWWLLWWMMMK.", "KMLLWWWLWWWMMMMK", "KMLLWWKLWWKMMMMK", "KMLLWWKLWWKMMMMK",
      "KMLLLLLLLMMMMMMK", "KMLLLLLMMMMMMMMK", "KMLLLMMMMMMMDDDK", "KMMMMMMMMMMDDDDK",
      "KMMDKKMMKKDDKDDK", "KDKK..KK..KK.KDK", "KK............KK", "................"
    ],
    bud: [
      "....KK....", "...KHGK...", "..KHGAGK..", "..KGHDGK..",
      ".KHGAGGDK.", ".KGHGDGHK.", "KHGADGHGDK", "KGGHGGADK.",
      ".KDGHDGK..", "..KDDDK...", "...KK....."
    ],
    joint: [
      "............K.K.", "...........KTKTK", "..........KKTTK.",
      ".........KWWKK..", ".......KKWWWEEK.", "......KWWWWEEEK.",
      "....KKWWWEEEELK.", "...KWWWWEEELKK..", "..KWWEEELKK.....",
      ".KWEELKK........", "KWEKK...........", ".KK............."
    ]
  };

  const colors = {
    frog: { K: "#162313", G: "#76b937", L: "#bce75a", Y: "#f8d954", E: "#e5ec9e" },
    bat: { K: "#171525", M: "#9b82c2", D: "#514566", Y: "#ffda66", W: "#fff1cd", L: "#c9acdf" },
    bud: { K: "#253b24", G: "#88ba4a", H: "#cce57d", D: "#547631", A: "#e2a25b" },
    joint: { K: "#473a29", W: "#fff4d7", E: "#ddcba0", L: "#9f8961", T: "#eee1bd" }
  };

  const ghostColors = [
    { M: "#df765f", L: "#f9a088", D: "#aa4444" },
    { M: "#719adb", L: "#96d6eb", D: "#4f59a4" },
    { M: "#c286cf", L: "#eab9e8", D: "#8954a0" }
  ];
  const frightened = { M: "#3265a2", L: "#78d6d2", D: "#253667" };
  const canvases = new Map();

  function sprite(name, variant = 0) {
    const id = name + variant;
    if (canvases.has(id)) return canvases.get(id);
    const pixels = outlines[name];
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(...pixels.map(row => row.length));
    canvas.height = pixels.length;
    const ink = canvas.getContext("2d");
    const palette = name === "ghost"
      ? { K: "#211b28", W: "#fff3d6", ...(ghostColors[variant] || frightened) }
      : colors[name];
    pixels.forEach((row, y) => {
      Array.from(row).forEach((pixel, x) => {
        if (pixel === ".") return;
        ink.fillStyle = palette[pixel];
        ink.fillRect(x, y, 1, 1);
      });
    });
    canvases.set(id, canvas);
    return canvas;
  }

  function draw(ctx, name, x, y, size, { variant = 0, flip = false, squash = 1 } = {}) {
    const image = sprite(name, variant);
    const width = size;
    const height = Math.round(size * image.height / image.width * squash);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, -Math.floor(width / 2), -Math.floor(height / 2), width, height);
    ctx.restore();
  }

  return { draw };
})();
