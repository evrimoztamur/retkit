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
            public readonly position: Vector2;
            public readonly size: Vector2;

            public constructor(position, size) {
                this.position = position;
                this.size = size;
            }
        }

        export class Actor extends Entity {
            public readonly sprite: Sprite;

            public constructor(position, size, sprite) {
                super(position, size);

                this.sprite = sprite;
            }
        }

        export class Tile extends Entity {
            public readonly sprite: Sprite;

            public constructor(position, size, sprite) {
                super(position, size);

                this.sprite = sprite;
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
                    throw new Error('Tile location out of room bounds');
                }

                return this.tiles[x][y];
            }

            public setTile(x, y, tile) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    throw new Error('Tile location out of room bounds');
                }

                this.tiles[x][y] = tile;
            }
        }

        export class Sprite {
            public position: Vector2;
            public offset: Vector2;
            public size: Vector2;
            public texels: Vector2[];
            public color: Vector3;

            public constructor(position, offset, size, texelTL, texelDR, color) {
                this.position = position;
                this.offset = offset;
                this.size = size;

                this.texels = [];
                this.texels[0] = texelTL;
                this.texels[1] = texelDR;

                this.color = color;
            }
        }

        export class Vector2 {
            public x: number;
            public y: number;

            public constructor(x, y) {
                this.x = x;
                this.y = y;
            }
        }

        export class Vector3 {
            public x: number;
            public y: number;
            public z: number;

            public constructor(x, y, z) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
        }
    }

    export class Canvas {
        private readonly canvas: HTMLCanvasElement;
        public readonly renderer: Renderer;

        private scale: number;

        public constructor(width: number, height: number, scale: number) {
            this.canvas = document.createElement('canvas');

            this.renderer = new Renderer(this.canvas.getContext('webgl'));

            this.resize(width, height, scale);
        }

        private get width() {
            return this.canvas.width;
        }

        private get height() {
            return this.canvas.height;
        }

        public resize(width: number, height: number, scale: number) {
            this.scale = scale;

            this.canvas.width = width;
            this.canvas.height = height;

            this.canvas.style.width = (this.width * this.scale) + 'px';
            this.canvas.style.height = (this.height * this.scale) + 'px';

            this.renderer.resize(width, height);
        }

        public appendCanvasTo(element: HTMLElement) {
            element.appendChild(this.canvas);
        }

        public setCanvasID(id: string) {
            this.canvas.id = id;
        }
    }

    export class Renderer {
        private webGLContext: WebGLRenderingContext;

        public width: number;
        public height: number;

        private boundTexture: WebGLTexture;
        private boundFramebuffer: WebGLFramebuffer;
        private boundProgram: WebGLProgram;

        public constructor(webGLContext: WebGLRenderingContext) {
            this.webGLContext = webGLContext;
        }

        public get gl() {
            return this.webGLContext;
        }

        public resize(width: number, height: number) {
            this.width = width;
            this.height = height;
        }

        public bindTexture(texture: WebGLTexture);
        public bindTexture(texture: Renderer.Texture) {
            let gl = this.webGLContext;

            let glTexture: WebGLTexture;

            if (texture instanceof Renderer.Texture) {
                glTexture = texture.glTexture;
            } else {
                glTexture = texture;
            }

            if (glTexture !== this.boundTexture) {
                this.boundTexture = glTexture;

                gl.bindTexture(gl.TEXTURE_2D, glTexture);
            }
        }

        public bindFramebuffer(framebuffer: WebGLFramebuffer);
        public bindFramebuffer(framebuffer: Renderer.Framebuffer) {
            let gl = this.webGLContext;

            let glFramebuffer: WebGLFramebuffer;

            if (framebuffer instanceof Renderer.Framebuffer) {
                glFramebuffer = framebuffer.glFramebuffer;
            } else {
                glFramebuffer = framebuffer;
            }

            if (glFramebuffer !== this.boundFramebuffer) {
                this.boundFramebuffer = glFramebuffer;

                gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffer);
            }
        }

        public bindProgram(program: WebGLProgram);
        public bindProgram(program: Renderer.Program) {
            let gl = this.webGLContext;

            let glProgram: WebGLProgram;

            if (program instanceof Renderer.Program) {
                glProgram = program.glProgram;
            } else {
                glProgram = program;
            }

            if (glProgram !== this.boundProgram) {
                this.boundProgram = glProgram;

                gl.useProgram(glProgram);
            }
        }

        public enableProgramVertexAttributes(program: Renderer.Program) {
            let gl = this.webGLContext;

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
            let gl = this.webGLContext;

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
            let gl = this.webGLContext;

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
            let gl = this.webGLContext;

            let framebuffer = gl.createFramebuffer();

            this.bindFramebuffer(framebuffer);

            let texture = gl.createTexture();

            this.bindTexture(texture);

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
            let gl = this.webGLContext;

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
            let gl = this.webGLContext;

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
            let gl = this.webGLContext;

            gl.bindBuffer(gl.ARRAY_BUFFER, batch.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, batch.vertices, gl.DYNAMIC_DRAW);
        }

        public drawBatch(batch: Renderer.Batch, program: Renderer.Program, framebuffer: Renderer.Framebuffer, texture: Renderer.Texture) {
            let gl = this.webGLContext;

            this.bindProgram(program);

            gl.viewport(0, 0, this.width, this.height);

            gl.bindBuffer(gl.ARRAY_BUFFER, batch.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.elementBuffer);

            this.enableProgramVertexAttributes(program);
            this.bindFramebuffer(framebuffer);
            this.bindTexture(texture);

            gl.drawElements(gl.TRIANGLES, batch.usedIndices, gl.UNSIGNED_SHORT, 0);
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

            public usedIndices: number;

            public constructor(vertexBuffer: WebGLBuffer, elementBuffer: WebGLBuffer, vertices: Float32Array, length: number) {
                this.vertexBuffer = vertexBuffer;
                this.elementBuffer = elementBuffer;
                this.vertices = vertices;
                this.length = length;

                this.usedIndices = 0;
            }

            public addQuad(x, y, w, h, ua, va, ub, vb, r, g, b) {
                let offset = (this.usedIndices / 6) * 28;

                this.vertices.set([x, y + h, r, g, b, ua, vb], offset);
                this.vertices.set([x + w, y + h, r, g, b, ub, vb], offset + 7);
                this.vertices.set([x + w, y, r, g, b, ub, va], offset + 14);
                this.vertices.set([x, y, r, g, b, ua, va], offset + 21);

                this.usedIndices += 6;
            }

            public addSprite(sprite: Game.Sprite) {
                let x = sprite.position.x + sprite.offset.x,
                    y = sprite.position.y + sprite.offset.y,
                    w = sprite.size.x,
                    h = sprite.size.y,
                    ua = sprite.texels[0].x,
                    va = sprite.texels[0].y,
                    ub = sprite.texels[1].x,
                    vb = sprite.texels[1].y,
                    r = sprite.color.x,
                    g = sprite.color.y,
                    b = sprite.color.z;

                this.addQuad(x, y, w, h, ua, va, ub, vb, r, g, b);
            }
        }
    }
}

function main() {
    let retkitGame = new Retkit.Game();

    let retkitCanvas = new Retkit.Canvas(320, 200, 2);

    retkitCanvas.setCanvasID('testbed-canvas');
    retkitCanvas.appendCanvasTo(document.body);

    let retkitRenderer = retkitCanvas.renderer;

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

    retkitRenderer.gl.uniform1i(retkitProgram.uniforms['u_Texture'].location, 0);
    retkitRenderer.gl.uniformMatrix4fv(retkitProgram.uniforms['u_Matrix'].location, false, [0.00625, 0, 0, 0, 0, -0.01, 0, 0, 0, 0, -1, 0, -1, 1, -0, 1]);

    retkitRenderer.gl.enable(retkitRenderer.gl.BLEND);
    retkitRenderer.gl.blendFunc(retkitRenderer.gl.SRC_ALPHA, retkitRenderer.gl.ONE);

    let retkitAtlas = retkitRenderer.buildTextureFromSource('./png/atlas.png');

    let retkitBatch = retkitRenderer.buildBatch(4096);

    let timer = 0;

    retkitGame.run((time, deltaTime) => { timer = time; }, () => {
        retkitBatch.usedIndices = 0;

        let sprof = (~~(timer * 10) & 1) * 0.25;

        retkitBatch.addQuad(0, 64 - Math.abs(Math.sin(timer * 5)) * 32, 32, 32, sprof, 0, sprof + .25, .25, 1, 1, 1);
        retkitBatch.addQuad(64, 64 - Math.abs(Math.cos(timer * 3)) * 16, 32, 32, sprof + .25, 0, sprof, .25, 2, .5, 2);

        retkitRenderer.flushBatch(retkitBatch);

        retkitRenderer.drawBatch(retkitBatch, retkitProgram, null, retkitAtlas);
    });
}

main();