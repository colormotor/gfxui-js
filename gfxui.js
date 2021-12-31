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

const gfxui = function() { }

/// Configuration/appearance
gfxui.cfg = {
  dragger_size: 10,
  line_width: 1,
  corner_rounding: 5,
  hover_color: '#0055CC',
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
  mouse_delta: [0, 0]
}

/// Internal state
const ui = {
  ctx: null,
  drawlist: [],
  active: null,
  hovered: null,
  cur_id: 0,
  statusstr: '',
  selector_dragging: false,
  selector_pos: [0, 0]
}

const _mousemove = (event) => {
  if (ui.ctx != null) {
    var rect = ui.ctx.canvas.getBoundingClientRect();
    gfxui.state.mouse_delta = [event.offsetX - gfxui.state.mousepos[0],
    event.offsetY - gfxui.state.mousepos[1]];
    gfxui.state.mousepos = [event.offsetX, event.offsetY];
    // event.preventDefault();
    // event.stopPropagation();
    event.returnValue = false;
  }
}

const _mousedown = (event) => {
  if (event.which) {
    if (!gfxui.state.dragging) {
      gfxui.state.mousepos = [event.offsetX, event.offsetY];
      gfxui.state.mouse_delta = [0, 0];
    }
    gfxui.state.dragging = true;
    gfxui.state.clicked = true;
    // event.preventDefault();
    // event.stopPropagation();
    event.returnValue = false;
  }
}

const _mouseup = (event) => {
  if (event.which) {
    gfxui.state.dragging = false;
    ui.active = null;
    // event.preventDefault();
    // event.stopPropagation();
    event.returnValue = false;
  }
}

const _keydown = (event) => {
  gfxui.state.alt_key = event.altKey;
  gfxui.state.shift_key = event.shiftKey;
}

const _keyup = (event) => {
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

/**
 * @returns if mouse is dragging
 */
gfxui.dragging = () => {
  return gfxui.state.dragging;
}

/**
 * @returns if mouse has been clicked
 */
gfxui.clicked = () => {
  return gfxui.state.clicked;
}

/**
 * @returns if mouse has been clicked
 */
gfxui.hovered = () => {
  return ui.hovered == ui.cur_id-1;
}

/**
 * @returns mouse delta
 */
gfxui.mouse_delta = () => {
  return gfxui.state.mouse_delta;
}

/**
 * @returns mouse delta
 */
gfxui.mouse_pos = () => {
  return gfxui.state.mousepos;
}



/** Initialize UI */
gfxui.init = (icon_font_url = 'url(icons.woff)') => {
  const capt = false;
  document.addEventListener('mousemove', _mousemove, capt);
  document.addEventListener('mouseup', _mouseup, capt);
  document.addEventListener('mousedown', _mousedown, capt);
  //document.addEventListener("touchstart", _mousedown, capt);
  //document.addEventListener("touchend", _mouseup, capt);
  //document.addEventListener("touchcancel", _mouseup, capt);
  //document.addEventListener("touchmove", _mousemove, capt);
  document.addEventListener('keydown', _keydown, capt);
  document.addEventListener('keyup', _keyup, capt);

  // Load icon font
  var icon_font = new FontFace('Icon Font', icon_font_url);
  icon_font.load().then(function(loaded_face) {
    document.fonts.add(loaded_face);
    document.body.style.fontFamily = '"Icon Font", Arial';
    console.log('Loaded icon font');
  }).catch(function(error) {
    console.log(error)
    // error occurred
  });
}

/**
 * Start defining UI widgets
 * @param {any} ctx
 */
gfxui.begin = (ctx = null) => {
  ui.cur_id = 0;
  ui.drawlist = [];
  //ui.active = null;
  ui.hovered = null;

  if (ctx == null)
    ui.ctx = document.getElementById('canvas').getContext('2d');
  else
    ui.ctx = ctx;
}

gfxui.end = (draw=true) => {
  gfxui.state.clicked = false;
  if (draw)
    gfxui.draw();
}

gfxui.has_focus = () => {
  return ui.active != null || ui.hovered != null;
}

gfxui.draw = () => {
  ui.ctx.save();
  ui.ctx.resetTransform();
  ui.drawlist.map(f => f());
  ui.ctx.restore();
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
  const hovered = gfxui.point_in_rect(gfxui.state.mousepos, rect);

  if (hovered){
    ui.hovered = id;
  }

  if (gfxui.state.clicked && hovered)
    ui.active = id;

  var clr = cfg.fill_color;
  if (hovered || id == ui.active || selected)
    clr = cfg.hover_color;

  gfxui.draw_dragger(rect, clr);
  return pos.slice(0);
}

gfxui.highlight_dragger = (pos, size=-1) => {
  const cfg = gfxui.cfg;
  if (size < 0)
    size = cfg.dragger_size;
  const rect = rect_from_circle(pos, size);
  gfxui.draw_dragger(rect, cfg.selected_color);
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
      else
        len = length(gfxui.state.mousepos, pos);
      gfxui.state.modified = true;
    }
  }
  // Specify object
  const hp = handle_pos(pos, theta + startTheta, len);
  const rect = rect_from_circle(hp, cfg.dragger_size * 0.8);
  const hovered = gfxui.point_in_rect(gfxui.state.mousepos, rect);
  if (hovered){
    ui.hovered = id;
  }
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
 * Pressing alt while manipulating handles, forces them to the same length.
 * Pressing shift forces them to a length proportional to when interaction started.
 *
 * @param {any} t transform
 * @param {number} scale scale factor for handles representing transform (e.g 100 will result in handles with length 100 with the identity)
 * @param {bool} ortho forces the transform to be orthogonal
 * @param {bool} selected mark this widget as selected
 * @returns Updated transform
 */
gfxui.affine = (t, scale = 1, ortho = true, selected) => {
  gfxui.state.modified = false;

  var pmod = false, xmod = false, ymod = false;
  var phover = false, xhover = false, yhover = false;

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
  phover = gfxui.hovered();

  const shift = gfxui.state.shift_key;
  const alt = gfxui.state.alt_key;

  // x axis
  var px = vadd(pos, vmul(x, scale));
  px = gfxui.dragger(px, false, gfxui.cfg.dragger_size * 0.7);
  xmod = gfxui.modified();
  xhover = gfxui.hovered();

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
  yhover = gfxui.hovered();

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

  const id = gfxui.get_id();
  gfxui.state.modified = pmod | xmod | ymod;

  if (phover || xhover || yhover){
    ui.hovered = id;
  }

  if (Array.isArray(t)) {
    return [[x[0], y[0], pos[0]],
    [x[1], y[1], pos[1]],
    [0, 0, 1]];
  }

  return { x: x, y: y, pos: pos };
}

gfxui.tooltip = (txt) =>{
  if (gfxui.hovered() && !gfxui.dragging()){
    gfxui.text_background(gfxui.mouse_pos(), txt);
  }
}

gfxui.text = (pos, txt, clr = null, align = 'left', font = null) => {
  if (clr == null)
    clr = gfxui.cfg.text_color;
  if (font == null)
    font = gfxui.cfg.text_font;
  draw_text(pos, txt, clr, font, align);
}

gfxui.text_background = (pos, txt, clr = null, font = null) => {
  const cfg = gfxui.cfg;
  if (clr == null)
    clr = cfg.text_color;
  if (font == null)
    font = cfg.text_font;
  draw_text_background(pos, txt, clr, font, '#CCCCCC', cfg.corner_rounding)
  //draw_text(pos, txt, clr, font)
  //draw_text_bacground_text(pos, txt, clr, font, align);
}

gfxui.line = (a, b, clr = null, lw = 0, dash = []) => {
  if (clr == null)
    clr = gfxui.cfg.stroke_color;
  if (lw == 0)
    lw = gfxui.cfg.line_width;
  draw_line(a, b, clr, lw, dash);
}

gfxui.draw_dragger = (rect, clr) => {
  const cfg = gfxui.cfg;
  fill_rounded_rect(rect, cfg.corner_rounding, clr);
  stroke_rounded_rect(rect, cfg.corner_rounding, cfg.stroke_color, cfg.line_width * 2);
}

gfxui.show_status = () => {
  gfxui.text([20, 20], ui.statusstr);
}

gfxui.toolbar = (items, selected = 0, horizontal = false, pos = [0, 0], size = 24) => {
  const id = gfxui.get_id();

  var x = pos[0];
  var y = pos[1];
  const pad = 11;
  const border = 2;
  const extent = (size + pad) * items.length + 2 * (items.length - 1) + border * 2;

  if (horizontal)
    fill_rounded_rect([[x, y], [x + extent, y + size + pad + border * 2]], 4, '#222222');
  else
    fill_rounded_rect([[x, y], [x + size + pad + border * 2, y + extent]], 4, '#222222');
  x += border;
  y += border;
  for (var i = 0; i < items.length; i++) {
    let rect = [[x, y], [x + size + pad, y + size + pad]];
    const hovered = gfxui.point_in_rect(gfxui.state.mousepos, rect);

    if (hovered)
      ui.hovered = id;

    if (gfxui.state.clicked && hovered) {
      selected = i;
      //ui.active = id;
    }

    if (i == selected || hovered) {
      var bg = '#000000';
      var txtclr = gfxui.cfg.selected_color; //'#FFFFFF';
    } else {
      var bg = '#555555';
      var txtclr = '#BBBBBB';
    }
    fill_rounded_rect(rect, 2, bg);
    var clr =
      gfxui.text([x + size / 2 + pad / 2, y + size * 0.9 + pad / 2], items[i], txtclr, 'center', size + 'px "Icon Font"');
    if (horizontal)
      x += size + pad + 2;
    else
      y += size + pad + 2;
  }

  return selected;
}

gfxui.make_flip_rect = (a, b) => {
  return [[Math.min(a[0], b[0]), Math.min(a[1], b[1])],
  [Math.max(a[0], b[0]), Math.max(a[1], b[1])]];
}

gfxui.point_in_rect = (p, rect) => {
  if (rect.length==0)
    return false;
  var [a, b] = rect;
  if (p[0] >= a[0] && p[0] <= b[0] &&
    p[1] >= a[1] && p[1] <= b[1])
    return true;
  return false;
}

gfxui.selector = () => {
  gfxui.state.modified = false;
  const none = [];

  // If previously called widgets have grabbred focus do nothing
  if (gfxui.has_focus())
    return none;

  if (gfxui.state.clicked && !gfxui.has_focus()) {
    ui.selector_dragging = true;
    ui.selector_pos = gfxui.state.mousepos;
    gfxui.state.modified = true;
    //console.log(gfxui.state.mousepos);
  }

  if (gfxui.state.dragging && ui.selector_dragging) {
    gfxui.state.modified = true;
    const rect = gfxui.make_flip_rect(ui.selector_pos, gfxui.state.mousepos);
    stroke_rect(rect, gfxui.cfg.selected_color, 1, [2, 5]);
    return rect;
  }

  if (!gfxui.state.dragging)
    ui.selector_dragging = false;

  return none;
}

const demo = () => {
  /// trick to mimic C/C++ static variables
  if (typeof demo.init == 'undefined') {
    demo.init = true;
    demo.pts = [[100, 300], [200, 300], [250, 400], [300, 300]];
    demo.mat = [[1, 0, 60],
    [0, 1, 30],
    [0, 0, 1]]; // Matrix example
    demo.tsm = { x: [1, 0], y: [0, 1], pos: [300, 30] }; // Transform example
    demo.bezier_pts = [[200, 450], [400, 350]];
    demo.bezier_tangents = [[0, 100], [0, 100]];
    demo.arc_theta = 0.5;
    demo.tool = 0;
  }

  demo.tool = gfxui.toolbar("ab", demo.tool);
  gfxui.tooltip("Select pencil to add points to polyline");

  // Polyline with draggers
  for (var i = 0; i < demo.pts.length; i++) {
    demo.pts[i] = gfxui.dragger(demo.pts[i]);
  }

  ui.ctx.strokeStyle = '#000000';
  ui.ctx.lineWidth = 7;
  ui.ctx.beginPath();
  ui.ctx.moveTo(...demo.pts[0]);
  for (const p of demo.pts.slice(1))
    ui.ctx.lineTo(...p);
  ui.ctx.stroke();

  // Bezier curve with length handles
  for (var i = 0; i < demo.bezier_pts.length; i++) {
    demo.bezier_pts[i] = gfxui.dragger(demo.bezier_pts[i]);
  }
  for (var i = 0; i < demo.bezier_tangents.length; i++) {
    demo.bezier_tangents[i] = gfxui.length_handle(demo.bezier_tangents[i], demo.bezier_pts[i]);
  }

  ui.ctx.beginPath();
  ui.ctx.moveTo(...demo.bezier_pts[0]);
  ui.ctx.bezierCurveTo(demo.bezier_pts[0][0] + Math.cos(demo.bezier_tangents[0][0]) * demo.bezier_tangents[0][1],
    demo.bezier_pts[0][1] + Math.sin(demo.bezier_tangents[0][0]) * demo.bezier_tangents[0][1],
    demo.bezier_pts[1][0] + Math.cos(demo.bezier_tangents[1][0]) * demo.bezier_tangents[1][1],
    demo.bezier_pts[1][1] + Math.sin(demo.bezier_tangents[1][0]) * demo.bezier_tangents[1][1],
    ...demo.bezier_pts[1]);
  ui.ctx.stroke();

  // Arc with handle
  const p = [300, 500];
  const r = 150;
  demo.arc_theta = gfxui.handle(demo.arc_theta, p, r);
  gfxui.tooltip("Drag to change angle")
  ui.ctx.resetTransform();
  ui.ctx.fillStyle = '#0099FF';
  ui.ctx.beginPath();
  ui.ctx.moveTo(p[0], p[1]);
  ui.ctx.arc(p[0], p[1], r, 0, demo.arc_theta);
  ui.ctx.closePath();
  ui.ctx.fill();

  // Affine transform with matrix (orthogonal)
  demo.mat = gfxui.affine(demo.mat, 100);
  gfxui.tooltip("press ALT to force uniform scale, SHIFT to keep current proportions");

  ui.ctx.setTransform(demo.mat[0][0], demo.mat[1][0], demo.mat[0][1], demo.mat[1][1], demo.mat[0][2], demo.mat[1][2]);
  gfxui.draw_house();
  ui.ctx.resetTransform();

  // Affine transform with object
  demo.tsm = gfxui.affine(demo.tsm, 100, false);
  gfxui.tooltip("press ALT to force uniform scale, SHIFT to keep current proportions");

  ui.ctx.setTransform(...demo.tsm.x, ...demo.tsm.y, ...demo.tsm.pos); // also kinda awkward
  gfxui.draw_house('#FF0000');
  ui.ctx.resetTransform();

  if (demo.tool == 1) {
    if (!gfxui.has_focus() && gfxui.state.clicked)
      demo.pts.push(gfxui.state.mousepos);
  } else {
    if (!gfxui.has_focus()) {
      var selector_rect = gfxui.selector();
    }
  }
}

gfxui.demo = demo;

const fill_rect = (rect, color) => {
  ui.drawlist.push(() => {
    ui.ctx.fillStyle = color;
    ui.ctx.fillRect(rect[0][0], rect[0][1], rect[1][0] - rect[0][0], rect[1][1] - rect[0][1]);
  })
}

const stroke_rect = (rect, color, lw = 1, dash = []) => {
  ui.drawlist.push(() => {
    ui.ctx.strokeStyle = color;
    ui.ctx.lineWidth = lw;
    ui.ctx.setLineDash(dash);
    ui.ctx.strokeRect(rect[0][0], rect[0][1], rect[1][0] - rect[0][0], rect[1][1] - rect[0][1]);
    ui.ctx.setLineDash([]);
  })
}

const draw_line = (a, b, color, lw = 1, dash = []) => {
  ui.drawlist.push(() => {
    ui.ctx.strokeStyle = color;
    ui.ctx.lineWidth = lw;
    ui.ctx.setLineDash(dash);
    ui.ctx.beginPath();
    ui.ctx.moveTo(a[0], a[1]);
    ui.ctx.lineTo(b[0], b[1]);
    ui.ctx.stroke();
    ui.ctx.setLineDash([]);
  })
}

const draw_text = (pos, txt, color, font, align = 'left') => {
  ui.drawlist.push(() => {
    ui.ctx.fillStyle = color;
    ui.ctx.font = font;
    ui.ctx.textAlign = align;
    ui.ctx.fillText(txt, pos[0], pos[1]);
  })
}

const draw_text_background = (pos, txt, clr, font, bgclr, r) => {
  ui.drawlist.push(() => {

    ui.ctx.fillStyle = bgclr;
    ui.ctx.font = font;

    const m = ui.ctx.measureText(txt);
    const w = m.width;
    const h = m.actualBoundingBoxAscent;
    const pad = 5;
    rounded_rect([[pos[0]-pad, pos[1] - h - pad], [pos[0] + w + pad, pos[1] + pad]], r);
    ui.ctx.fill();

    ui.ctx.fillStyle = clr;
    ui.ctx.textAlign = 'left';

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


module.exports = gfxui;
