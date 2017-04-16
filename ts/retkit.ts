namespace Retkit {
    export class Game {
        public run(updateFunction: (time, deltaTime) => void, renderFunction: () => void) {
            var time = 0;
            var deltaTime = 1 / 64;

            var currentTime = performance.now() / 1000;
            var accumulator = 0;

            var loopCallback = function () {
                window.requestAnimationFrame(loopCallback);

                var newTime = performance.now() / 1000;
                var frameTime = Math.min(newTime - currentTime, 0.25);

                currentTime = newTime;
                accumulator += frameTime;

                while (accumulator >= deltaTime) {
                    updateFunction(time, deltaTime);

                    time += deltaTime;
                    accumulator -= deltaTime;
                }

                renderFunction();
            };

            window.requestAnimationFrame(loopCallback);
        }
    }

    export namespace Game {
        export class Entity {
            public readonly collider: Collider;

            public constructor(collider) {
                this.collider = collider;
            }
        }

        export class Actor extends Entity {
            public readonly sprite: Sprite;

            public constructor(collider, sprite) {
                super(collider);

                this.sprite = sprite;
            }

            public synchroniseSprite() {
                this.sprite.position.x = this.collider.position.x;
                this.sprite.position.y = this.collider.position.y;
            }
        }

        export class Tile extends Entity {
            public readonly sprite: Sprite;

            public constructor(collider, sprite) {
                super(collider);

                this.sprite = sprite;
            }

            public synchroniseSprite() {
                this.sprite.position.x = this.collider.position.x;
                this.sprite.position.y = this.collider.position.y;
            }
        }

        export class Room {
            private tiles: Tile[][];

            public readonly width: number;
            public readonly height: number;

            public constructor(width, height) {
                this.width = width;
                this.height = height;

                this.tiles = [];

                for (var i = 0; i < width; i++) {
                    this.tiles[i] = [];

                    for (var j = 0; j < height; j++) {
                        this.tiles[i][j] = null;
                    }
                }
            }

            public getTile(x, y) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    console.error('Tile location out of room bounds');
                    return;
                }

                return this.tiles[x][y];
            }

            public setTile(x, y, tile) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    console.error('Tile location out of room bounds');
                    return;
                }

                this.tiles[x][y] = tile;
            }
        }

        export class Sprite {
            public position: Vector2;
            public offset: Vector2;
            public size: Vector2;
            public texelPosition: Vector2;
            public texelSize: Vector2;
            public color: Vector3;

            public constructor(position: Vector2, offset: Vector2, size: Vector2, texelPosition: Vector2, texelSize: Vector2, color: Vector3) {
                this.position = position;
                this.offset = offset;
                this.size = size;

                this.texelPosition = texelPosition;
                this.texelSize = texelSize;

                this.color = color;
            }
        }

        export class Collider {
            public readonly position: Vector2;
            public readonly size: Vector2;

            public constructor(position: Vector2, size: Vector2) {
                this.position = position;
                this.size = size;
            }

            public sweepX(motion: number, collider: Collider): number {
                let entryTime = 1;

                if (this.position.y < (collider.position.y + collider.size.y) && (this.position.y + this.size.y) > collider.position.y) {
                    if (motion > 0) {
                        let perEntryTime = (-this.position.x - this.size.x + collider.position.x) / motion;

                        if (perEntryTime >= 0 && perEntryTime < 1) {
                            entryTime = perEntryTime;
                        }
                    } else if (motion < 0) {
                        let perEntryTime = (-this.position.x + collider.position.x + collider.size.x) / motion;

                        if (perEntryTime >= 0 && perEntryTime < 1) {
                            entryTime = perEntryTime;
                        }
                    }
                }

                return entryTime;
            }

            public sweepY(motion: number, collider: Collider): number {
                let entryTime = 1;

                if (this.position.x < (collider.position.x + collider.size.x) && (this.position.x + this.size.x) > collider.position.x) {
                    if (motion > 0) {
                        let perEntryTime = (-this.position.y - this.size.y + collider.position.y) / motion;

                        if (perEntryTime >= 0 && perEntryTime < 1) {
                            entryTime = perEntryTime;
                        }
                    } else if (motion < 0) {
                        let perEntryTime = (-this.position.y + collider.position.y + collider.size.y) / motion;

                        if (perEntryTime >= 0 && perEntryTime < 1) {
                            entryTime = perEntryTime;
                        }
                    }
                }

                return entryTime;
            }

            public move(motion: Vector2, colliders: Collider[]) {
                let entryTimeX = 1;

                for (var i = 0; i < colliders.length; i++) {
                    let collider = colliders[i];

                    let perEntryTime = this.sweepX(motion.x, collider);

                    if (perEntryTime < entryTimeX) {
                        entryTimeX = perEntryTime;
                    }
                }

                this.position.x += motion.x * entryTimeX;

                let entryTimeY = 1;

                for (var i = 0; i < colliders.length; i++) {
                    let collider = colliders[i];

                    let perEntryTime = this.sweepY(motion.y, collider);

                    if (perEntryTime < entryTimeY) {
                        entryTimeY = perEntryTime;
                    }
                }

                this.position.y += motion.y * entryTimeY;
            }
        }

        export class Vector2 {
            public x: number;
            public y: number;

            public constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
            }

            public setByValue(x: number, y: number) {
                this.x = x;
                this.y = y;
            }

            public set(vector: Vector2) {
                this.x = vector.x;
                this.y = vector.y;
            }
        }

        export class Vector3 {
            public x: number;
            public y: number;
            public z: number;

            public constructor(x: number, y: number, z: number) {
                this.x = x;
                this.y = y;
                this.z = z;
            }

            public setByValue(x: number, y: number, z: number) {
                this.x = x;
                this.y = y;
                this.z = z;
            }

            public set(vector: Vector3) {
                this.x = vector.x;
                this.y = vector.y;
                this.z = vector.z;
            }
        }
    }

    export class Canvas {
        public readonly canvasElement: HTMLCanvasElement;
        public readonly renderer: Renderer;

        public scale: number;

        public constructor(width: number, height: number, scale: number) {
            this.canvasElement = document.createElement('canvas');

            this.canvasElement.tabIndex = 1;

            this.renderer = new Renderer(this.canvasElement.getContext('webgl', { antialias: false }));

            this.resize(width, height, scale);
        }

        public get width() {
            return this.canvasElement.width;
        }

        public get height() {
            return this.canvasElement.height;
        }

        public resize(width: number, height: number, scale: number) {
            this.scale = scale;

            this.canvasElement.width = width;
            this.canvasElement.height = height;

            this.canvasElement.style.width = (this.width * this.scale) + 'px';
            this.canvasElement.style.height = (this.height * this.scale) + 'px';

            this.renderer.resizeViewport(width, height);
        }

        public appendCanvasTo(element: HTMLElement) {
            element.appendChild(this.canvasElement);
        }

        public setCanvasID(id: string) {
            this.canvasElement.id = id;
        }
    }

    export class Renderer {
        private webGLContext: WebGLRenderingContext;

        public viewportWidth: number;
        public viewportHeight: number;

        private boundTexture: WebGLTexture;
        private boundFramebuffer: WebGLFramebuffer;
        private boundProgram: WebGLProgram;

        public constructor(webGLContext: WebGLRenderingContext) {
            this.webGLContext = webGLContext;
        }

        public get gl() {
            return this.webGLContext;
        }

        public resizeViewport(width: number, height: number) {
            this.viewportWidth = width;
            this.viewportHeight = height;
        }

        public enableAlphaBlending() {
            let gl = this.gl;

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        public bindTexture(texture: Renderer.Texture) {
            let gl = this.gl;

            let glTexture: WebGLTexture = texture.glTexture;

            if (glTexture !== this.boundTexture) {
                this.boundTexture = glTexture;

                gl.bindTexture(gl.TEXTURE_2D, glTexture);
            }
        }

        public bindFramebuffer(framebuffer: Renderer.Framebuffer) {
            let gl = this.gl;

            let glFramebuffer: WebGLFramebuffer

            if (framebuffer) {
                glFramebuffer = framebuffer.glFramebuffer;
            }

            if (glFramebuffer !== this.boundFramebuffer) {
                this.boundFramebuffer = glFramebuffer;

                gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffer);
            }
        }

        public bindProgram(program: Renderer.Program) {
            let gl = this.gl;

            let glProgram: WebGLProgram = program.glProgram;

            if (glProgram !== this.boundProgram) {
                this.boundProgram = glProgram;

                gl.useProgram(glProgram);
            }
        }

        public setProgramUniform(uniform: Renderer.Uniform, value: any) {
            let gl = this.gl;

            let glUniformLocation: WebGLUniformLocation = uniform.location;
            let glUniformType: number = uniform.type;

            switch (glUniformType) {
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(glUniformLocation, value);
                    break;
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(glUniformLocation, value);
                    break;
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(glUniformLocation, value);
                    break;
                case gl.FLOAT_MAT3:
                    gl.uniformMatrix3fv(glUniformLocation, false, value);
                    break;
                case gl.FLOAT_MAT4:
                    gl.uniformMatrix4fv(glUniformLocation, false, value);
                    break;
                case gl.SAMPLER_2D:
                    gl.uniform1i(glUniformLocation, value);
                    break;
            }
        }

        public enableProgramVertexAttributes(program: Renderer.Program) {
            let gl = this.gl;

            let location = 0;

            let stride = (!!program.attributes['a_Position'] && 8) +
                (!!program.attributes['a_Color'] && 12) +
                (!!program.attributes['a_TexCoord'] && 8);

            let offset = 0;

            if (program.attributes['a_Position']) {
                location = program.attributes['a_Position'].location;

                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 2, gl.FLOAT, false, stride, offset);

                offset += 8;
            }

            if (program.attributes['a_Color']) {
                location = program.attributes['a_Color'].location;

                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 3, gl.FLOAT, false, stride, offset);

                offset += 12;
            }

            if (program.attributes['a_TexCoord']) {
                location = program.attributes['a_TexCoord'].location;

                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, 2, gl.FLOAT, false, stride, offset);

                offset += 8;
            }
        }

        public buildProgramFromSources(vertexSource: string, fragmentSource: string): Renderer.Program {
            let gl = this.gl;

            let program = gl.createProgram();

            gl.attachShader(program, this.compileShaderFromSource(vertexSource, gl.VERTEX_SHADER));
            gl.attachShader(program, this.compileShaderFromSource(fragmentSource, gl.FRAGMENT_SHADER));

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('PROGRAM_LINK_ERROR', gl.getProgramInfoLog(program));

                gl.deleteProgram(program);

                return;
            }

            let activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            let activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

            let uniforms = {};

            for (var i = 0; i < activeUniforms; i++) {
                let uniform = gl.getActiveUniform(program, i);

                let location = gl.getUniformLocation(program, uniform.name);

                uniforms[uniform.name] = new Renderer.Uniform(location, uniform.type);
            }

            let attributes = {};

            for (var i = 0; i < activeAttributes; i++) {
                var attribute = gl.getActiveAttrib(program, i);

                let location = gl.getAttribLocation(program, attribute.name);

                attributes[attribute.name] = new Renderer.Attribute(location, attribute.type);
            }

            return new Renderer.Program(program, uniforms, attributes);
        }

        private compileShaderFromSource(source: string, type: number): WebGLShader {
            let gl = this.gl;

            let shader = gl.createShader(type);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('SHADER_COMPILE_ERROR', gl.getShaderInfoLog(shader));

                gl.deleteShader(shader);

                return;
            }

            return shader;
        }

        public buildFramebuffer(width, height): Renderer.Framebuffer {
            let gl = this.gl;

            let framebuffer = gl.createFramebuffer();

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

            let texture = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            let renderbuffer = gl.createRenderbuffer;

            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

            return new Renderer.Framebuffer(framebuffer, texture, renderbuffer);
        }

        public buildTextureFromSource(source): Renderer.Texture {
            let gl = this.gl;

            let texture = gl.createTexture();

            let image = new Image();

            image.addEventListener('load', _ => {
                gl.bindTexture(gl.TEXTURE_2D, texture);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            });

            image.src = source;

            return new Renderer.Texture(texture, image);
        }

        public buildBatch(length): Renderer.Batch {
            let gl = this.gl;

            let vertices = new Float32Array(length * 4 * Renderer.Batch.ATTRIBUTES_LENGTH);

            let vertexBuffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

            let indices = new Uint16Array(length * 6);

            for (var i = 0; i < length; i++) {
                var i4 = i * 4;

                indices.set([i4 + 0, i4 + 1, i4 + 2, i4 + 2, i4 + 3, i4 + 0], i * 6);
            }

            var elementBuffer = gl.createBuffer();

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);

            return new Renderer.Batch(vertexBuffer, elementBuffer, vertices, length);
        }

        public flushBatch(batch: Renderer.Batch) {
            let gl = this.gl;

            batch.flushedIndices = batch.pushedIndices;
            batch.pushedIndices = 0;

            gl.bindBuffer(gl.ARRAY_BUFFER, batch.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, batch.vertices, gl.DYNAMIC_DRAW);
        }

        public drawBatch(batch: Renderer.Batch, program: Renderer.Program, framebuffer: Renderer.Framebuffer, texture: Renderer.Texture) {
            let gl = this.gl;

            this.bindProgram(program);

            gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);

            gl.bindBuffer(gl.ARRAY_BUFFER, batch.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.elementBuffer);

            this.enableProgramVertexAttributes(program);
            this.bindFramebuffer(framebuffer);
            this.bindTexture(texture);

            gl.drawElements(gl.TRIANGLES, batch.flushedIndices, gl.UNSIGNED_SHORT, 0);
        }
    }

    export namespace Renderer {
        export class Framebuffer {
            public readonly glFramebuffer: WebGLFramebuffer;
            public readonly glTexture: WebGLTexture;
            public readonly glRenderbuffer: WebGLRenderbuffer;

            public constructor(glFramebuffer: WebGLFramebuffer, glTexture: WebGLTexture, glRenderbuffer: WebGLRenderbuffer) {
                this.glFramebuffer = glFramebuffer;
                this.glTexture = glTexture;
                this.glRenderbuffer = glRenderbuffer;
            }
        }

        export class Texture {
            public readonly glTexture: WebGLTexture;

            private readonly image: HTMLImageElement;

            public constructor(glTexture: WebGLTexture, image: HTMLImageElement) {
                this.glTexture = glTexture;
                this.image = image;
            }

            public get width() {
                return this.image.width;
            }

            public get height() {
                return this.image.height;
            }

            public get loaded() {
                return this.image.complete && this.image.naturalHeight !== 0
            }
        }

        export class Program {
            public readonly glProgram: WebGLProgram;

            public readonly uniforms: Object;
            public readonly attributes: Object;

            public constructor(glProgram: WebGLProgram, uniforms: Object, attributes: Object) {
                this.glProgram = glProgram;
                this.uniforms = uniforms;
                this.attributes = attributes;
            }
        }

        export class Attribute {
            public readonly location: number;
            public readonly type: number;

            public constructor(location: number, type: number) {
                this.location = location;
                this.type = type;
            }
        }

        export class Uniform {
            public readonly location: WebGLUniformLocation;
            public readonly type: number;

            public constructor(location: WebGLUniformLocation, type: number) {
                this.location = location;
                this.type = type;
            }
        }

        export class Batch {
            public static readonly ATTRIBUTES_LENGTH = 7;

            public readonly vertexBuffer: WebGLBuffer;
            public readonly elementBuffer: WebGLBuffer;
            public readonly vertices: Float32Array;
            public readonly length: number;

            public pushedIndices: number;
            public flushedIndices: number;

            public constructor(vertexBuffer: WebGLBuffer, elementBuffer: WebGLBuffer, vertices: Float32Array, length: number) {
                this.vertexBuffer = vertexBuffer;
                this.elementBuffer = elementBuffer;
                this.vertices = vertices;
                this.length = length;

                this.pushedIndices = 0;
                this.flushedIndices = 0;
            }

            public pushQuad(x, y, w, h, ua, va, ub, vb, r, g, b) {
                let offset = (this.pushedIndices / 6) * 28;

                this.vertices.set([x, y + h, r, g, b, ua, vb], offset);
                this.vertices.set([x + w, y + h, r, g, b, ub, vb], offset + 7);
                this.vertices.set([x + w, y, r, g, b, ub, va], offset + 14);
                this.vertices.set([x, y, r, g, b, ua, va], offset + 21);

                this.pushedIndices += 6;
            }

            public pushSprite(sprite: Game.Sprite) {
                let x = sprite.position.x + sprite.offset.x,
                    y = sprite.position.y + sprite.offset.y,
                    w = sprite.size.x,
                    h = sprite.size.y,
                    ua = sprite.texelPosition.x,
                    va = sprite.texelPosition.y,
                    ub = ua + sprite.texelSize.x,
                    vb = va + sprite.texelSize.y,
                    r = sprite.color.x,
                    g = sprite.color.y,
                    b = sprite.color.z;

                this.pushQuad(x, y, w, h, ua, va, ub, vb, r, g, b);
            }
        }
    }

    export class Input {
        private canvas: Canvas;

        private coreFocused: boolean;

        private coreRealCursor: Game.Vector2;
        private coreCursor: Game.Vector2;

        private coreButtons: boolean[];

        private coreKeys: Object;

        public cursor: Game.Vector2;
        public deltaCursor: Game.Vector2;

        public buttons: boolean[];
        public buttonsClicked: boolean[];

        public keys: Object;
        public keysPressed: Object;

        public constructor(canvas: Canvas) {
            this.canvas = canvas;

            this.coreFocused = false;

            this.coreRealCursor = new Game.Vector2(0, 0);
            this.coreCursor = new Game.Vector2(0, 0);

            this.coreButtons = [];

            this.coreKeys = {};

            this.cursor = new Game.Vector2(0, 0);
            this.deltaCursor = new Game.Vector2(0, 0);

            this.buttons = [];
            this.buttonsClicked = [];

            this.keys = {};
            this.keysPressed = {};

            this.addListenersTo(canvas.canvasElement);
        }

        private addListenersTo(element: HTMLElement) {
            let self = this;

            element.addEventListener('mousedown', function (event) {
                if (self.coreFocused) {
                    self.coreButtons[event.button] = true;
                } else {
                    element.requestPointerLock();
                }
            });

            element.addEventListener('mouseup', function (event) {
                if (self.coreFocused) {
                    self.coreButtons[event.button] = false;
                }
            });

            element.addEventListener('mousemove', function (event) {
                if (self.coreFocused) {
                    self.coreRealCursor.x += event.movementX;
                    self.coreRealCursor.y += event.movementY;

                    self.coreRealCursor.x = Math.min(Math.max(self.coreRealCursor.x, 0), self.canvas.width);
                    self.coreRealCursor.y = Math.min(Math.max(self.coreRealCursor.y, 0), self.canvas.height - 1);

                    self.coreCursor.x = Math.floor(self.coreRealCursor.x / self.canvas.scale);
                    self.coreCursor.y = Math.floor(self.coreRealCursor.y / self.canvas.scale);
                }
            });

            element.addEventListener('keydown', function (event) {
                if (self.coreFocused) {
                    event.preventDefault();

                    self.coreKeys[event.key] = true;
                }
            });

            element.addEventListener('keyup', function (event) {
                if (self.coreFocused) {
                    event.preventDefault();

                    self.coreKeys[event.key] = false;
                }
            });

            element.addEventListener('pointerlockchange', function () {
                self.coreFocused = document.pointerLockElement === element;

                if (self.coreFocused) {
                    self.canvas.canvasElement.focus();
                } else {
                    self.canvas.canvasElement.blur();
                }
            });
        }

        private updateCursor() {
            let oldCursor = new Game.Vector2(this.cursor.x, this.cursor.y);

            this.cursor.set(this.coreCursor);
            this.deltaCursor.setByValue(this.cursor.x - oldCursor.x, this.cursor.y - oldCursor.y);
        }

        private updateButtons() {
            let oldButtons = this.buttons;
            let newButtons = this.coreButtons;

            for (var button in newButtons) {
                this.buttonsClicked[button] = newButtons[button] && !oldButtons[button];
                this.buttons[button] = newButtons[button];
            }
        }

        private updateKeys() {
            let oldKeys = this.keys;
            let newKeys = this.coreKeys;

            for (var key in newKeys) {
                this.keysPressed[key] = newKeys[key] && !oldKeys[key];
                this.keys[key] = newKeys[key];
            }
        }

        public process() {
            this.updateCursor();
            this.updateButtons();
            this.updateKeys();
        }
    }
}

function main() {
    let retkitGame = new Retkit.Game();

    let retkitCanvas = new Retkit.Canvas(320, 200, 2);

    retkitCanvas.setCanvasID('testbed-canvas');
    retkitCanvas.appendCanvasTo(document.body);

    let retkitInput = new Retkit.Input(retkitCanvas);

    let retkitRenderer = retkitCanvas.renderer;

    window['gl'] = retkitRenderer.gl;

    let retkitProgram = retkitRenderer.buildProgramFromSources(
        `attribute vec2 a_Position;
attribute vec3 a_Color;
attribute vec2 a_TexCoord;

uniform mat4 u_Matrix;

varying vec3 v_Color;
varying vec2 v_TexCoord;

void main() {
    gl_Position = u_Matrix * vec4(a_Position, 0, 1);

    v_Color = a_Color;
    v_TexCoord = a_TexCoord;
}`,
        `precision mediump float;

varying vec3 v_Color;
varying vec2 v_TexCoord;

uniform sampler2D u_Texture;

void main() {
    gl_FragColor = texture2D(u_Texture, v_TexCoord) * vec4(v_Color, 1);
}`);

    retkitRenderer.bindProgram(retkitProgram);

    retkitRenderer.setProgramUniform(retkitProgram.uniforms['u_Matrix'], [0.00625, 0, 0, 0, 0, -0.01, 0, 0, 0, 0, -1, 0, -1, 1, -0, 1]);

    retkitRenderer.enableAlphaBlending();

    let retkitAtlas = retkitRenderer.buildTextureFromSource('./png/atlas.png');

    let retkitBatch = retkitRenderer.buildBatch(4096);

    let retkitPlayerCollider = new Retkit.Game.Collider(new Retkit.Game.Vector2(32, 16), new Retkit.Game.Vector2(16, 16));

    let retkitPlayerSprite = new Retkit.Game.Sprite(new Retkit.Game.Vector2(0, 0),
        new Retkit.Game.Vector2(0, 0),
        new Retkit.Game.Vector2(16, 16),
        new Retkit.Game.Vector2(0, 0),
        new Retkit.Game.Vector2(0.25, 0.25),
        new Retkit.Game.Vector3(1, 1, 1));

    let retkitPlayer = new Retkit.Game.Actor(retkitPlayerCollider, retkitPlayerSprite);

    let retkitTileCollider = new Retkit.Game.Collider(new Retkit.Game.Vector2(96, 32), new Retkit.Game.Vector2(16, 16));
    let retkitTileCollider2 = new Retkit.Game.Collider(new Retkit.Game.Vector2(80, 48), new Retkit.Game.Vector2(16, 16));

    let retkitTileSprite = new Retkit.Game.Sprite(new Retkit.Game.Vector2(0, 0),
        new Retkit.Game.Vector2(0, 0),
        new Retkit.Game.Vector2(16, 16),
        new Retkit.Game.Vector2(0, 0.5),
        new Retkit.Game.Vector2(0.25, 0.25),
        new Retkit.Game.Vector3(1, 1, 1));

    let retkitTile = new Retkit.Game.Tile(retkitTileCollider, retkitTileSprite);

    let retkitTileColliders = [retkitTileCollider, retkitTileCollider2];

    retkitGame.run((time, deltaTime) => {
        retkitInput.process();

        let sprof = (~~(time * 10) & 1) * 0.25;

        retkitPlayerCollider.move(new Retkit.Game.Vector2(Math.sin(time * 4) * 2, Math.sin(time + 1) / 2), retkitTileColliders);

        retkitPlayerSprite.texelPosition.x = sprof;

        retkitPlayer.synchroniseSprite();

        retkitTile.synchroniseSprite();
    }, () => {
        retkitBatch.pushSprite(retkitPlayerSprite);
        retkitBatch.pushSprite(retkitTileSprite);

        retkitRenderer.flushBatch(retkitBatch);
        retkitRenderer.drawBatch(retkitBatch, retkitProgram, null, retkitAtlas);
    });
}

main();