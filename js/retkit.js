var Retkit;
(function (Retkit) {
    class Game {
        run(updateFunction, renderFunction) {
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
    Retkit.Game = Game;
    class Canvas {
        constructor(width, height, scale) {
            this.canvas = document.createElement('canvas');
            this.renderer = new Renderer(this.canvas.getContext('webgl'));
            this.resize(width, height, scale);
        }
        get width() {
            return this.canvas.width;
        }
        get height() {
            return this.canvas.height;
        }
        resize(width, height, scale) {
            this.scale = scale;
            this.canvas.width = width;
            this.canvas.height = height;
            this.canvas.style.width = (this.width * this.scale) + 'px';
            this.canvas.style.height = (this.height * this.scale) + 'px';
            this.renderer.resize(width, height);
        }
        appendCanvasTo(element) {
            element.appendChild(this.canvas);
        }
        setCanvasID(id) {
            this.canvas.id = id;
        }
    }
    Retkit.Canvas = Canvas;
    class Renderer {
        constructor(webGLContext) {
            this.webGLContext = webGLContext;
        }
        get gl() {
            return this.webGLContext;
        }
        resize(width, height) {
            this.width = width;
            this.height = height;
        }
        bindTexture(texture) {
            let gl = this.webGLContext;
            let glTexture;
            if (texture instanceof Renderer.Texture) {
                glTexture = texture.glTexture;
            }
            else {
                glTexture = texture;
            }
            if (glTexture !== this.boundTexture) {
                this.boundTexture = glTexture;
                gl.bindTexture(gl.TEXTURE_2D, glTexture);
            }
        }
        bindFramebuffer(framebuffer) {
            let gl = this.webGLContext;
            let glFramebuffer;
            if (framebuffer instanceof Renderer.Framebuffer) {
                glFramebuffer = framebuffer.glFramebuffer;
            }
            else {
                glFramebuffer = framebuffer;
            }
            if (glFramebuffer !== this.boundFramebuffer) {
                this.boundFramebuffer = glFramebuffer;
                gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffer);
            }
        }
        bindProgram(program) {
            let gl = this.webGLContext;
            let glProgram;
            if (program instanceof Renderer.Program) {
                glProgram = program.glProgram;
            }
            else {
                glProgram = program;
            }
            if (glProgram !== this.boundProgram) {
                this.boundProgram = glProgram;
                gl.useProgram(glProgram);
            }
        }
        enableProgramVertexAttributes(program) {
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
        buildProgramFromSources(vertexSource, fragmentSource) {
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
        compileShaderFromSource(source, type) {
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
        buildFramebuffer(width, height) {
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
        buildTextureFromSource(source) {
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
        buildBatch(length) {
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
        flushBatch(batch) {
            let gl = this.webGLContext;
            gl.bindBuffer(gl.ARRAY_BUFFER, batch.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, batch.vertices, gl.DYNAMIC_DRAW);
        }
        drawBatch(batch, program, framebuffer, texture) {
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
    Retkit.Renderer = Renderer;
    (function (Renderer) {
        class Framebuffer {
            constructor(glFramebuffer, glTexture, glRenderbuffer) {
                this.glFramebuffer = glFramebuffer;
                this.glTexture = glTexture;
                this.glRenderbuffer = glRenderbuffer;
            }
        }
        Renderer.Framebuffer = Framebuffer;
        class Texture {
            constructor(glTexture, image) {
                this.glTexture = glTexture;
                this.image = image;
            }
            get width() {
                return this.image.width;
            }
            get height() {
                return this.image.height;
            }
            get loaded() {
                return this.image.complete && this.image.naturalHeight !== 0;
            }
        }
        Renderer.Texture = Texture;
        class Program {
            constructor(glProgram, uniforms, attributes) {
                this.glProgram = glProgram;
                this.uniforms = uniforms;
                this.attributes = attributes;
            }
        }
        Renderer.Program = Program;
        class Attribute {
            constructor(location, type) {
                this.location = location;
                this.type = type;
            }
        }
        Renderer.Attribute = Attribute;
        class Uniform {
            constructor(location, type) {
                this.location = location;
                this.type = type;
            }
        }
        Renderer.Uniform = Uniform;
        class Batch {
            constructor(vertexBuffer, elementBuffer, vertices, length) {
                this.vertexBuffer = vertexBuffer;
                this.elementBuffer = elementBuffer;
                this.vertices = vertices;
                this.length = length;
                this.usedIndices = 0;
            }
            addQuad(x, y, w, h, ua, va, ub, vb, r, g, b) {
                let offset = (this.usedIndices / 6) * 28;
                this.vertices.set([x, y + h, r, g, b, ua, vb], offset);
                this.vertices.set([x + w, y + h, r, g, b, ub, vb], offset + 7);
                this.vertices.set([x + w, y, r, g, b, ub, va], offset + 14);
                this.vertices.set([x, y, r, g, b, ua, va], offset + 21);
                this.usedIndices += 6;
            }
        }
        Batch.ATTRIBUTES_LENGTH = 7;
        Renderer.Batch = Batch;
    })(Renderer = Retkit.Renderer || (Retkit.Renderer = {}));
})(Retkit || (Retkit = {}));
function main() {
    let retkitGame = new Retkit.Game();
    let retkitCanvas = new Retkit.Canvas(320, 200, 2);
    retkitCanvas.setCanvasID('testbed-canvas');
    retkitCanvas.appendCanvasTo(document.body);
    let retkitRenderer = retkitCanvas.renderer;
    let retkitProgram = retkitRenderer.buildProgramFromSources(`attribute vec2 a_Position;
attribute vec3 a_Color;
attribute vec2 a_TexCoord;

uniform mat4 u_Matrix;

varying vec3 v_Color;
varying vec2 v_TexCoord;

void main() {
    gl_Position = u_Matrix * vec4(a_Position, 0, 1);

    v_Color = a_Color;
    v_TexCoord = a_TexCoord;
}`, `precision mediump float;

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
