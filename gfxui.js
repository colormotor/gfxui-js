/**
 *  ######   ######## ##     ## ##     ## ####
 * ##    ##  ##        ##   ##  ##     ##  ##
 * ##        ##         ## ##   ##     ##  ##
 * ##   #### ######      ###    ##     ##  ##
 * ##    ##  ##         ## ##   ##     ##  ##
 * ##    ##  ##        ##   ##  ##     ##  ##
 *  ######   ##       ##     ##  #######  ####
 *
 * Immediate mode GUI for manipulating vector=graphics/images.
 * © Daniel Berio (@colormotor) 2021 - ...
 *
 * */
'use strict'

const gfxui = function() {}

/// Configuration/appearance
gfxui.cfg = {
  dragger_size: 10,
  line_width: 1,
  corner_rounding: 5,
  hover_color: '#FF0000',
  fill_color: '#777777',
  stroke_color: '#222222',
  selected_color: '#0099FF',
  text_color: '#444444',
  text_font: '10px sans serif'
}

/// Public space
gfxui.state = {
  modified: false,
  dragging: false,
  clicked: false,
  shift_key: false,
  alt_key: false,
  mousepos: [0, 0],
}

/// Internal state
const ui = {
  ctx: null,
  drawlist: [],
  active: null,
  cur_id: 0
}



const _mousemove = (event) => {
  if (ui.ctx != null) {
    var rect = ui.ctx.canvas.getBoundingClientRect();
    gfxui.state.mousepos = [event.offsetX, event.offsetY];
  }
}

const _mousedown = (event) => {
  if (event.which) {
    gfxui.state.dragging = true;
    gfxui.state.clicked = true;
  }
}

const _mouseup = (event) => {
  if (event.which) {
    gfxui.state.dragging = false;
    ui.active = null;
  }
}

const _keypressed = (event) => {
  gfxui.state.alt_key = event.altKey;
  gfxui.state.shift_key = event.shiftKey;
}

const _keyreleased = (event) => {
  gfxui.state.alt_key = event.altKey;
  gfxui.state.shift_key = event.shiftKey;
}

/// Returns and increments current id
gfxui.get_id = () => {
  return ui.cur_id++;
}

/**
 * @returns if last defined widget has been modified
 */
gfxui.modified = () => {
  return gfxui.state.modified;
}

/** Initialize UI */
gfxui.init = () => {
  document.addEventListener('mousemove', _mousemove);
  document.addEventListener('mouseup', _mouseup);
  document.addEventListener('mousedown', _mousedown);
}

/**
 * Start defining UI widgets
 * @param {any} ctx
 */
gfxui.begin = (ctx = null) => {
  ui.cur_id = 0;
  ui.drawlist = [];
  if (ctx == null)
    ui.ctx = document.getElementById('canvas').getContext('2d');
  else
    ui.ctx = ctx;
}

gfxui.end = () => {
  gfxui.state.clicked = false;
}

gfxui.draw = () => {
  ui.ctx.resetTransform();
  fill_rect(rect_from_circle(gfxui.state.mousepos, 3, '#00FF00'));
  ui.drawlist.map(f => f());
}

gfxui.draw_house = (clr = '#000000', pos = [0, 0]) => {
  const ctx = ui.ctx;
  // Set line width
  ctx.lineWidth = 10;

  // Wall
  ctx.strokeStyle = clr;
  ctx.fillStyle = clr;
  ctx.strokeRect(pos[0] + 25, pos[1] + 80, 150, 110);

  // Door
  ctx.fillRect(pos[0] + 25 + 55, pos[1] + 130, 40, 60);

  // Roof
  ctx.beginPath();
  ctx.moveTo(pos[0] + 0, pos[1] + 80);
  ctx.lineTo(pos[0] + 100, pos[1] + 0);
  ctx.lineTo(pos[0] + 200, pos[1] + 80);
  ctx.closePath();
  ctx.stroke();
}


/**
 * Create a widget that can be used to drag a point
 * @param {Array} pos [x, y] position
 * @param {any} selected mark this widget as selected
 * @param {any} size if specified, half width of widget
 * @returns {Array} [x, y] updated position
 */
gfxui.dragger = (pos, selected = false, size = -1) => {
  const id = gfxui.get_id();
  const cfg = gfxui.cfg;
  if (size < 0)
    size = cfg.dragger_size;
  gfxui.state.modified = false;

  // handle active object
  // This must be done before processing hovered status
  if (gfxui.state.dragging && id == ui.active) {
    pos = gfxui.state.mousepos;
    gfxui.state.modified = true;
  }

  const rect = rect_from_circle(pos, size);
  const hovered = point_in_rect(gfxui.state.mousepos, rect);

  if (gfxui.state.clicked && hovered)
    ui.active = id;

  var clr = cfg.fill_color;
  if (hovered || id == ui.active || selected)
    clr = cfg.hover_color;

  gfxui.draw_dragger(rect, clr);
  return pos.slice(0);
}


/**
 * Create a handle widget with adjustable angle and length
 * @param {Array} thetaLen [theta, length] array with angle in radians and length
 * @param {Array} pos anchor position of handle
 * @param {number} startTheta base angle of handle
 * @param {Array} length_range [min,max] length range
 * @param {Array} theta_range [min,max] angle range
 * @param {bool} selected mark this widget as selected
 * @returns {Array} [angle, length] updated values
 */
gfxui.length_handle = (thetaLen, pos, startTheta = 0, length_range = [], theta_range = [], selected = false) => {
  const id = gfxui.get_id();
  const cfg = gfxui.cfg;
  gfxui.state.modified = false;
  const vbase = [Math.cos(startTheta), Math.sin(startTheta)];

  var res = false;
  var [theta, len] = thetaLen;

  // handle active object
  if (id == ui.active) {
    if (gfxui.state.dragging) {
      var vmouse = vsub(gfxui.state.mousepos, pos);
      theta = angle_between(vbase, vmouse); //::atan2( ImGui::GetMousePos()[1] - pos[1], ImGui::GetMousePos()[0] - pos[0] );

      if (theta_range.length == 2)
        theta = Math.max(Math.min(theta, theta_range[1]), theta_range[0]);

      if (length_range.length == 2)
        len = Math.min(Math.max(length(gfxui.state.mousepos, pos), length_range[0]), length_range[1]);
      gfxui.state.modified = true;
    }
  }
  // Specify object
  const hp = handle_pos(pos, thetaLen[0] + startTheta, thetaLen[1]);
  const rect = rect_from_circle(hp, cfg.dragger_size * 0.8);
  const hovered = point_in_rect(gfxui.state.mousepos, rect);

  if (gfxui.state.clicked && hovered)
    ui.active = id;

  var clr = cfg.fill_color;
  if (hovered || id == ui.active || selected)
    clr = cfg.hover_color;

  draw_line(pos, hp);
  gfxui.draw_dragger(rect, clr);
  return [theta, len];
}


/**
 * Create a handle widget with fixed length
 * @param {number} theta angle
 * @param {Array} pos anchor position of handle
 * @param {number} startTheta base angle of handle
 * @param {number} length length of handle
 * @param {Array} theta_range [min,max] angle range
 * @param {bool} selected mark this widget as selected
 * @returns {number} updated angle
 */
gfxui.handle = (theta, pos, length, startTheta = 0, theta_range = [], selected = false) => {
  var [theta, l] = gfxui.length_handle([theta, length], pos, 0.0, [length, length], theta_range, selected);
  return theta;
}


/**
 * Create a (2d) affine transform widget.
 * A transform can be represented as either a matrix or an object. An identity transform would be
 * - [[1, 0, 0], [0, 1, 0], [0, 0, 1]] for the matrix case (Array of Arrays)
 * - {x:[1, 0], y:[0, 1], pos:[0, 0]} for the object case.
 * The function returns the same format used as an input
 * @param {any} t transform
 * @param {number} scale scale factor for handles representing transform (e.g 100 will result in handles with length 100 with the identity)
 * @param {bool} ortho forces the transform to be orthogonal
 * @param {bool} selected mark this widget as selected
 * @returns Updated transform
 */
gfxui.affine = (t, scale = 1, ortho = true, selected) => {
  const id = gfxui.get_id();
  gfxui.state.modified = false;

  var pmod = false, xmod = false, ymod = false;
  var x, y, pos;
  if (Array.isArray(t)) {
    x = [t[0][0], t[1][0]];
    y = [t[0][1], t[1][1]];
    pos = [t[0][2], t[1][2]];
  } else {
    x = t.x.slice(0);
    y = t.y.slice(0);
    pos = t.pos.slice(0);
  }

  pos = gfxui.dragger(pos, selected, gfxui.cfg.dragger_size);
  pmod = gfxui.modified();

  const shift = gfxui.state.shift_key;
  const alt = gfxui.state.alt_key;

  // x axis
  var px = vadd(pos, vmul(x, scale));
  px = gfxui.dragger(px, false, gfxui.cfg.dragger_size * 0.7);
  xmod = gfxui.modified();

  var tx = vdiv(vsub(px, pos), scale);
  var rx = norm(tx) / norm(x);

  if (xmod) {
    x = vdiv(vsub(px, pos), scale);
    if (ortho)
      y = force_ortho(y, x, alt);
    if (shift)
      y = vmul(y, rx);
    if (alt)
      y = vmul(vdiv(y, norm(y)), norm(tx));
  }

  // y axis
  var py = vadd(pos, vmul(y, scale));
  py = gfxui.dragger(py, false, gfxui.cfg.dragger_size * 0.7);
  ymod = gfxui.modified();

  var ty = vdiv(vsub(py, pos), scale);
  var ry = norm(ty) / norm(y);

  if (ymod) {
    y = vdiv(vsub(py, pos), scale);
    if (ortho)
      x = force_ortho(x, y, alt);
    if (shift)
      x = vmul(x, ry);
    if (alt)
      x = vmul(vdiv(x, norm(x)), norm(ty));
  }

  gfxui.line(pos, px);
  gfxui.line(pos, py);

  gfxui.state.modified = pmod | xmod | ymod;

  if (Array.isArray(t)) {
    return [[x[0], y[0], pos[0]],
    [x[1], y[1], pos[1]],
    [0, 0, 1]];
  }

  return { x: x, y: y, pos: pos };
}

gfxui.text = (pos, txt, clr = null, font = 0) => {
  if (clr == null)
    clr = gfxui.cfg.text_color;
  if (font == null)
    font = gfxui.cfg.text_font;
  draw_text(pos, txt, clr, font);
}

gfxui.line = (a, b, clr = null, lw = 0) => {
  if (clr == null)
    clr = gfxui.cfg.stroke_color;
  if (lw == 0)
    lw = gfxui.cfg.line_width;
  draw_line(a, b, clr, lw);
}

gfxui.draw_dragger = (rect, clr) => {
  const cfg = gfxui.cfg;
  fill_rounded_rect(rect, cfg.corner_rounding, clr);
  stroke_rounded_rect(rect, cfg.corner_rounding, cfg.stroke_color, cfg.line_width * 2);
}


const fill_rect = (rect, color) => {
  ui.drawlist.push(() => {
    ui.ctx.fillStyle = color;
    ui.ctx.fillRect(rect[0][0], rect[0][1], rect[1][0] - rect[0][0], rect[1][1] - rect[0][1]);
  })
}

const stroke_rect = (rect, color, lw = 1) => {
  ui.drawlist.push(() => {
    ui.ctx.strokeStyle = color;
    ui.ctx.lineWidth = lw;
    ui.ctx.strokeRect(rect[0][0], rect[0][1], rect[1][0] - rect[0][0], rect[1][1] - rect[0][1]);
  })
}

const draw_line = (a, b, color, lw = 1) => {
  ui.drawlist.push(() => {
    ui.ctx.strokeStyle = color;
    ui.ctx.lineWidth = lw;
    ui.ctx.beginPath();
    ui.ctx.moveTo(a[0], a[1]);
    ui.ctx.lineTo(b[0], b[1]);
    ui.ctx.stroke();
  })
}

const draw_text = (pos, txt, color, font) => {
  ui.drawlist.push(() => {
    ui.ctx.fillStyle = color;
    ui.ctx.font = font;
    ui.ctx.fillText(txt, pos[0], pos[1]);
  })
}

const rounded_rect = (rect, r) => {
  var [x, y] = rect[0];
  var [w, h] = [rect[1][0] - rect[0][0], rect[1][1] - rect[0][1]];
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ui.ctx.beginPath();
  ui.ctx.moveTo(x + r, y);
  ui.ctx.arcTo(x + w, y, x + w, y + h, r);
  ui.ctx.arcTo(x + w, y + h, x, y + h, r);
  ui.ctx.arcTo(x, y + h, x, y, r);
  ui.ctx.arcTo(x, y, x + w, y, r);
  ui.ctx.closePath();
}

const fill_rounded_rect = (rect, r, color) => {
  ui.drawlist.push(() => {
    ui.ctx.fillStyle = color;
    rounded_rect(rect, r);
    ui.ctx.fill();
  })
}

const stroke_rounded_rect = (rect, r, color, lw = 1) => {
  ui.drawlist.push(() => {
    ui.ctx.strokeStyle = color;
    ui.ctx.lineWidth = lw;
    rounded_rect(rect, r);
    ui.ctx.stroke();
  })
}

const norm = (v) => {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

const length = (a, b) => {
  return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
}

const angle_between = (a, b) => {
  return Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
}

const vsub = (a, b) => {
  return [a[0] - b[0], a[1] - b[1]];
}

const vadd = (a, b) => {
  return [a[0] + b[0], a[1] + b[1]];
}

const vdiv = (v, s) => {
  return [v[0] / s, v[1] / s];
}

const vmul = (v, s) => {
  return [v[0] * s, v[1] * s];
}

const force_ortho = (v, to, same_scale) => {
  // Todo store old norm for when alt is released
  const nv = norm(v);
  const nto = norm(to);

  v = vdiv(v, nv);
  to = vdiv(to, nto);
  const p = [-to[1], to[0]];
  v = vmul(p, p[0] * v[0] + p[1] * v[1]);
  v = vdiv(v, norm(v));
  if (same_scale)
    v = vmul(v, nto);
  else
    v = vmul(v, nv);
  return v;
}

const handle_pos = (pos, theta, l) => {
  return [pos[0] + Math.cos(theta) * l, pos[1] + Math.sin(theta) * l];
}

const rect_from_circle = (p, r) => {
  const rd = Math.sqrt(2) * r * 0.5;
  return [[p[0] - rd, p[1] - rd], [p[0] + rd, p[1] + rd]];
}

const point_in_rect = (p, rect) => {
  var [a, b] = rect;
  if (p[0] >= a[0] && p[0] <= b[0] &&
    p[1] >= a[1] && p[1] <= b[1])
    return true;
  return false;
}

module.exports = gfxui;
