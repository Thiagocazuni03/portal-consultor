import { Div, Canvas, Button, Icon } from "./Prototypes.js";

/**
 * @author João Pedro
 * @requires jquery
 * @requires prototype
 */

export default class Signature {
   constructor(config) {

      //Configuração
      this.config = $.extend(true, {

         width: 500,
         height: 250,
         stroke: "#000",

      }, config ?? {});

      this.pencil = {
         active: false,
         moving: false,
         pos: {
            x: 0,
            y: 0,
         },
         posPrevius: null,
      };

      // Criando Elementos
      this.container = new Div("SP__signature");
      this.content = new Div("SP__signature__content");
      this.canvas = new Canvas("SP__signature__content__canvas");
      this.context = this.canvas[0].getContext("2d");
      this.reset = new Button("SP__signature__content__reset");
      this.resetIcon = new Icon("ic-update");

      // Posicionando Elementos no Container
      this.container.append(this.content);

      // Posicionando Elementos no Contend
      this.content.append(this.canvas);
      this.content.append(this.reset);

      // Adicionando Icons
      this.reset.append(this.resetIcon);

      this.init()
   }

   init() {
      var canvas = this.canvas[0];
      canvas.width = this.config.width;
      canvas.height = this.config.height;

      canvas.onmousedown = () => {
         this.pencil.active = true;
         this.reset.addClass("isHidden")

      };

      canvas.onmouseup = () => {
         this.pencil.active = false;
         this.reset.removeClass("isHidden")
      };

      canvas.onmousemove = (event) => {
         this.pencil.pos.x = event.offsetX;
         this.pencil.pos.y = event.offsetY;
         this.pencil.moving = true;
      };
      const draw = (line) => {
         this.context.strokeStyle = this.config.stroke;

         this.context.beginPath();
         this.context.moveTo(line.posPrevius.x, line.posPrevius.y);
         this.context.lineTo(line.pos.x, line.pos.y);
         this.context.stroke();
      };

      const render = () => {
         if (
            this.pencil.active &&
            this.pencil.moving &&
            this.pencil.posPrevius
         ) {
            draw({
               pos: this.pencil.pos,
               posPrevius: this.pencil.posPrevius,
            });
            this.pencil.moving = false;
         }
         this.pencil.posPrevius = {
            x: this.pencil.pos.x,
            y: this.pencil.pos.y,
         };
         setTimeout(render, 10);
      };

      render();
      this.reset.click(() => this.resetCanvas());
   }

   resetCanvas() {
      this.context.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);
   }

   getAsBase64() {
      return this.canvas[0].toDataURL('image/png', 1)
   }

   getView() {
      return this.container
   }
}
