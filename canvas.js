(function() { document.addEventListener('DOMContentLoaded', (event) => {

  // Support Methods
  function cos_sin(wave, mult = 1, add = 0, invert = false, invertxy = false) {
    let x, y;
    if(Array.isArray(add)){
      x = !invertxy ? add[0] : add[1];
      y = !invertxy ? add[1] : add[0];
    }
    else{
      x = add;
      y = add;
    }
    wave = invert ? wave + 0.25 : wave;
    let cos = Math.cos(wave * 2 * Math.PI) * mult + x;
    let sin = Math.sin(wave * 2 * Math.PI) * mult + y;
    return invert ? [sin, cos] : [cos, sin];
  }

  const canvas = document.getElementById('canvas');;
  const ctx = canvas.getContext('2d');

  window.addEventListener('resize', resizeCanvas, false);

  let canvas_center, main_radius;
  function resizeCanvas() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    canvas_center = [canvas.width/2, canvas.height/2];
    main_radius = Math.min(canvas.width, canvas.height)/2 * 0.8;
  }
  resizeCanvas();

  // Shape Control Variables
  let larger, smaller;
  let sharpness, star_size;
  let base_points, base_circles, circle_radius_ratio, base_star_vertices, star_edges;
  (function() {
    let number_a = document.getElementById("number-a");
    let number_b = document.getElementById("number-b");
    let sharpness_control = document.getElementById("sharpness");
    let star_size_control = document.getElementById("star-size");
    //let label = document.getElementById("star-label");

    function update_star() {
      base_points = [];
      base_circles = [];
      base_star_vertices = [];
      star_edges = [];
      let a = parseInt(number_a.value);
      let b = parseInt(number_b.value);
      let p = Math.max(a, b);
      let q = Math.min(a, b);

      circle_radius_ratio = q/p;

      for(var i = 0; i < p; i++) {
        base_star_vertices[i] = cos_sin(i / p);
        star_edges[i] = (i + q) % p;
      }
      for(var i = 0; i < p-q; i++) {
        base_circles[i] = i / (p - q);
      }
      for(var i = 0; i < q; i++) {
        base_points[i] = i / q;
      }
      larger = p;
      smaller = q;
    }
    update_star();

    function update_path(){
      sharpness = parseFloat(sharpness_control.value);
      star_size = parseFloat(star_size_control.value);
    }
    update_path();

    number_a.addEventListener("change", update_star);
    number_b.addEventListener("change", update_star);
    sharpness_control.addEventListener("input", update_path);
    star_size_control.addEventListener("input", update_path);
  })();


  // View Control Variables
  let show, color, lineWidth, visible;
  (function() {
    let viewShow = new Object();
    let viewColor = new Object();
    let viewLineWidth = new Object();
    show = function(name) {return viewShow[name];}
    color = function(name) {return viewColor[name];}
    lineWidth = function(name) {return viewLineWidth[name];}
    visible = function(name) {return show(name) && lineWidth(name) > 0;}
    function registerViewControl(name) {
      registerViewSwitch(name);
      registerViewColor(name);
      registerViewSlider(name);
    }
    function registerViewSwitch(name) {
      var elementId = "view-" + name;
      var value = document.getElementById(elementId).checked;
      viewShow[name] = value;
      document.getElementById(elementId).addEventListener("change", function (e) {
        viewShow[name] = e.target.checked;
      });
    }
    function registerViewColor(name) {
      var elementId = "view-color-" + name;
      var value = document.getElementById(elementId).value;
      viewColor[name] = value;
      document.getElementById(elementId).addEventListener("input", function (e) {
        viewColor[name] = e.target.value;
      });
    }
    function registerViewSlider(name) {
      var elementId = "view-linewidth-" + name;
      var value = document.getElementById(elementId).value;
      viewLineWidth[name] = value;
      document.getElementById(elementId).addEventListener("input", function (e) {
        viewLineWidth[name] = e.target.value;
      });
    }


    registerViewControl("dots");
    registerViewControl("circles");
    registerViewControl("small-polygons");
    registerViewControl("large-polygons");
    registerViewControl("path");
    registerViewControl("star");
  })();

  // Animation Control Variables
  let animation_speed;
  (function() {
    let speed_control = document.getElementById("animation-speed");
    function update_speed() {
      animation_speed = parseFloat(speed_control.value);
    }
    update_speed();

    speed_control.addEventListener("input", update_speed);
  })();

  // Calculate
  let points, circles, circle_radius, star_vertices, path_points, calculate_static, calculate;
  (function() {
    calculate_static = function() {
      points = [];
      circles = [];
      circle_radius = main_radius * circle_radius_ratio;
      star_vertices = [];
      let size = (main_radius - circle_radius + circle_radius * (sharpness + (1 - sharpness) * star_size));
      base_star_vertices.forEach((e, i) => {
        star_vertices[i] = [canvas_center[0] + e[0] * size, canvas_center[1] + e[1] * size];
      });
    }
    calculate_static();
    calculate = function(percentage) {
      let diff = main_radius - circle_radius;
      base_circles.forEach((c, i) => {
        circles[i] = cos_sin(c - percentage, diff, canvas_center);
        points[i] = [];
        base_points.forEach((p, j) => {
          points[i][j] = cos_sin(p - (larger - smaller) / smaller * percentage, circle_radius * sharpness, circles[i], true, true);
        });
      });
      path_points = [];
      let steps = 100;
      for (var i = 0; i <= steps; i++) {
        let circle = cos_sin(base_circles[0] - i / (steps * larger / smaller) , diff);
        path_points[i] = cos_sin(base_points[0] - (larger - smaller) / smaller * i / (steps * larger / smaller), circle_radius * sharpness, circle, true, true);
      }
    }
    calculate();
  })();

  // Rendering
  (function() {
    function get_style(name){
      return {
        "visible" : visible(name),
        "color" : color(name),
        "width" : lineWidth(name)
      };
    }

    function draw_main_circle(style = get_style("circles")) {
      if (style["visible"]) {
        ctx.lineWidth = style["width"];
        ctx.strokeStyle = style["color"];
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(...canvas_center, main_radius, 0, 2*Math.PI);
        ctx.stroke();
      }
    }

    function draw_star(style = get_style("star")) {
      if (style["visible"]) {
        ctx.lineWidth = style["width"];
        ctx.strokeStyle = style["color"];
        ctx.globalAlpha = 1;
        ctx.lineCap = "round";
        star_vertices.forEach((v, i) => {
          ctx.beginPath();
          ctx.moveTo(...v);
          ctx.lineTo(...star_vertices[star_edges[i]]);
          ctx.stroke();
        });
      }
    }

    function draw_path(style = get_style("path")) {
      if (style["visible"]) {
        ctx.lineWidth = style["width"];
        ctx.strokeStyle = style["color"];
        ctx.globalAlpha = 1;
        ctx.lineCap = "round";
        ctx.translate(...canvas_center)
        for (var i = 0; i < larger; i++) {
          ctx.beginPath();
          ctx.moveTo(...path_points[0]);
          for(var j = 1; j < path_points.length; j++){
            ctx.lineTo(...path_points[j]);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(...path_points[j]);
          }
          ctx.rotate(2 * Math.PI / larger);
        }
        ctx.resetTransform();
      }
    }

    function draw_circles(style = get_style("circles")) {
      if (style["visible"]) {
        ctx.lineWidth = style["width"];
        ctx.strokeStyle = style["color"];
        ctx.globalAlpha = 1;
        circles.forEach((c, i) => {
          ctx.beginPath();
          ctx.arc(...c, circle_radius, 0, 2*Math.PI);
          ctx.stroke();
        });
      }
    }

    function draw_large_polygons(style = get_style("large-polygons")) {
      if (style["visible"]) {
        ctx.lineWidth = style["width"];
        ctx.strokeStyle = style["color"];
        ctx.globalAlpha = 0.5;
        ctx.lineCap = "round";
        let c = points.length;
        let p = points[0].length;
        for (var j = 0; j < p; j++){
          ctx.beginPath();
          ctx.moveTo(...points[0][j]);
          for(var i = 1; i < c; i++){
            ctx.lineTo(...points[i][j]);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(...points[i][j]);
          }
          ctx.lineTo(...points[0][j]);
          ctx.stroke();
        }
      }
    }

    function draw_small_polygons(style = get_style("small-polygons")) {
      if (style["visible"]) {
        ctx.lineWidth = style["width"];
        ctx.strokeStyle = style["color"];
        ctx.globalAlpha = 0.5;
        ctx.lineCap = "round";
        let c = points.length;
        let p = points[0].length;
        for (var i = 0; i < c; i++){
          ctx.beginPath();
          ctx.moveTo(...points[i][0]);
          for(var j = 0; j < p; j++){
            ctx.lineTo(...points[i][j]);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(...points[i][j]);
          }
          ctx.lineTo(...points[i][0]);
          ctx.stroke();
        }
      }
    }

    function draw_points(style = get_style("dots")) {
      if (style["visible"]) {
        let width = style["width"];
        ctx.lineWidth = width / 2;
        ctx.strokeStyle = style["color"];
        ctx.globalAlpha = 1;
        points.forEach((c, i) => {
          points[i].forEach((p, j) => {
            ctx.beginPath();
            ctx.arc(...p, width / 4, 0, 2*Math.PI);
            ctx.stroke();
          });
        });
      }
    }

    function draw_view() {
      draw_main_circle();
      draw_star();
      draw_path();
      draw_circles();
      draw_large_polygons();
      draw_small_polygons();
      draw_points();
    }

    let percent = 0;
    let prev_time = Date.now();
    let cur_time = prev_time;
    function render() {
      cur_time = Date.now();
      percent = (percent + (cur_time - prev_time)/1000 * animation_speed) % (1 / (larger - smaller));
      prev_time = cur_time;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      calculate_static();
      calculate(percent);
      draw_view();

      ctx.restore();
      window.requestAnimationFrame(render)
    }

    window.requestAnimationFrame(render);
  })();



});
}) ();
