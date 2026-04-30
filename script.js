/**
 * Antigravity Whiteboard Engine
 * A high-performance, object-oriented digital whiteboard.
 */

class WhiteboardObject {
    constructor(type, color, strokeWidth, opacity = 1) {
        this.type = type;
        this.color = color;
        this.strokeWidth = strokeWidth;
        this.opacity = opacity;
        this.selected = false;
        this.rotation = 0;
        this.x = 0;
        this.y = 0;
        this.creatorId = 'me'; // Default creator
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        this._render(ctx);
        ctx.globalAlpha = 1.0;
        if (this.selected) {
            this._drawSelection(ctx);
        }
        ctx.restore();
    }

    _drawSelection(ctx) {
        const bounds = this.getBounds(ctx);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(-2, -2, bounds.w + 4, bounds.h + 4);
        ctx.setLineDash([]);
        
        // Rotation handle
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(bounds.w / 2, -15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bounds.w / 2, -2);
        ctx.lineTo(bounds.w / 2, -10);
        ctx.stroke();
    }

    getBounds(ctx) {
        return { w: 0, h: 0 };
    }
}

class StrokeObject extends WhiteboardObject {
    constructor(points, color, strokeWidth, opacity = 1) {
        super('stroke', color, strokeWidth, opacity);
        this.points = points; // Array of {x, y}
        // Normalize position
        const minX = Math.min(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        this.x = minX;
        this.y = minY;
        this.points = points.map(p => ({ x: p.x - minX, y: p.y - minY }));
    }

    _render(ctx) {
        if (this.points.length < 2) return;
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length - 1; i++) {
            const xc = (this.points[i].x + this.points[i + 1].x) / 2;
            const yc = (this.points[i].y + this.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
        }
        ctx.stroke();
    }

    getBounds() {
        const maxX = Math.max(...this.points.map(p => p.x));
        const maxY = Math.max(...this.points.map(p => p.y));
        return { w: maxX, h: maxY };
    }

    isHit(x, y) {
        // Transform mouse pos to local space
        const dx = x - this.x;
        const dy = y - this.y;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        const bounds = this.getBounds();
        return localX >= -5 && localX <= bounds.w + 5 && localY >= -5 && localY <= bounds.h + 5;
    }

    isRotationHandleHit(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        const bounds = this.getBounds();
        const hX = bounds.w / 2;
        const hY = -15;
        const dist = Math.sqrt(Math.pow(localX - hX, 2) + Math.pow(localY - hY, 2));
        return dist <= 10;
    }
}

class RectObject extends WhiteboardObject {
    constructor(x, y, w, h, color, strokeWidth, fill = false, opacity = 1) {
        super('rect', color, strokeWidth, opacity);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.fill = fill;
    }

    _render(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        if (this.fill) {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, this.w, this.h);
        } else {
            ctx.strokeRect(0, 0, this.w, this.h);
        }
    }

    getBounds() { return { w: this.w, h: this.h }; }
    isHit(x, y) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        return lx >= 0 && lx <= this.w && ly >= 0 && ly <= this.h;
    }
    isRotationHandleHit(x, y) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        return Math.sqrt(Math.pow(lx - this.w / 2, 2) + Math.pow(ly - 15, 2)) <= 10;
    }
}

class CircleObject extends WhiteboardObject {
    constructor(x, y, r, color, strokeWidth, fill = false, opacity = 1) {
        super('circle', color, strokeWidth, opacity);
        this.x = x;
        this.y = y;
        this.r = r;
        this.fill = fill;
    }

    _render(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        if (this.fill) {
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    getBounds() { return { w: this.r * 2, h: this.r * 2 }; }
    isHit(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.r;
    }
    isRotationHandleHit(x, y) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        return Math.sqrt(Math.pow(lx - 0, 2) + Math.pow(ly - (-this.r - 15), 2)) <= 10;
    }
    draw(ctx) { // Circle is centered differently
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        this._render(ctx);
        if (this.selected) {
            const r = this.r;
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#3b82f6';
            ctx.strokeRect(-r-2, -r-2, r*2+4, r*2+4);
            ctx.setLineDash([]);
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath(); ctx.arc(0, -r-15, 5, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
}

class LineObject extends WhiteboardObject {
    constructor(x1, y1, x2, y2, color, strokeWidth, opacity = 1) {
        super('line', color, strokeWidth, opacity);
        this.x = x1;
        this.y = y1;
        this.dx = x2 - x1;
        this.dy = y2 - y1;
    }

    _render(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.dx, this.dy);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
    }

    getBounds() { return { w: Math.abs(this.dx), h: Math.abs(this.dy) }; }
    isRotationHandleHit(x, y) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        return Math.sqrt(Math.pow(lx - this.dx / 2, 2) + Math.pow(ly - (-15), 2)) <= 10;
    }
}

class TextObject extends WhiteboardObject {
    constructor(x, y, text, font, size, color, opacity = 1) {
        super('text', color, 1, opacity);
        this.x = x;
        this.y = y;
        this.text = text;
        this.font = font;
        this.size = size;
    }

    _render(ctx) {
        ctx.font = `${this.size}px ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.textBaseline = 'top';
        ctx.fillText(this.text, 0, 0);
    }

    getBounds(ctx) {
        ctx.font = `${this.size}px ${this.font}`;
        const metrics = ctx.measureText(this.text);
        return { w: metrics.width, h: this.size };
    }

    isHit(x, y, ctx) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        const bounds = this.getBounds(ctx);
        return lx >= 0 && lx <= bounds.w && ly >= 0 && ly <= bounds.h;
    }

    isRotationHandleHit(x, y, ctx) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        const bounds = this.getBounds(ctx);
        return Math.sqrt(Math.pow(lx - bounds.w / 2, 2) + Math.pow(ly - (-15), 2)) <= 10;
    }
}

class EraserObject extends WhiteboardObject {
    constructor(points, strokeWidth) {
        super('eraser', 'transparent', strokeWidth);
        this.points = points;
        const minX = Math.min(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        this.x = minX;
        this.y = minY;
        this.points = points.map(p => ({ x: p.x - minX, y: p.y - minY }));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalCompositeOperation = 'destination-out';
        this._render(ctx);
        ctx.restore();
    }

    _render(ctx) {
        if (this.points.length < 2) return;
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = this.strokeWidth;
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length - 1; i++) {
            const xc = (this.points[i].x + this.points[i + 1].x) / 2;
            const yc = (this.points[i].y + this.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
        }
        ctx.stroke();
    }
}

class ImageObject extends WhiteboardObject {
    constructor(x, y, img) {
        super('image', 'transparent', 0);
        this.x = x;
        this.y = y;
        this.img = img;
        this.w = img.width;
        this.h = img.height;
        
        const maxDim = 500;
        if (this.w > maxDim || this.h > maxDim) {
            const scale = Math.min(maxDim / this.w, maxDim / this.h);
            this.w *= scale;
            this.h *= scale;
        }
    }

    _render(ctx) {
        ctx.drawImage(this.img, 0, 0, this.w, this.h);
    }

    getBounds() { return { w: this.w, h: this.h }; }

    isHit(x, y) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        return lx >= 0 && lx <= this.w && ly >= 0 && ly <= this.h;
    }

    isRotationHandleHit(x, y) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        return Math.sqrt(Math.pow(lx - this.w / 2, 2) + Math.pow(ly - 15, 2)) <= 10;
    }
}

class FillObject extends WhiteboardObject {
    constructor(x, y, data, w, h, color) {
        super('fill', color, 0);
        this.x = x;
        this.y = y;
        this.data = data; // ImageData
        this.w = w;
        this.h = h;
    }

    _render(ctx) {
        ctx.putImageData(this.data, this.x, this.y);
    }
    
    draw(ctx) { // Special draw because of putImageData
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        // Note: putImageData is absolute, we should use a temporary canvas for transformations
        const temp = document.createElement('canvas');
        temp.width = this.w; temp.height = this.h;
        temp.getContext('2d').putImageData(this.data, 0, 0);
        ctx.drawImage(temp, 0, 0);
        if (this.selected) this._drawSelection(ctx);
        ctx.restore();
    }

    getBounds() { return { w: this.w, h: this.h }; }
    isHit(x, y) {
        const dx = x - this.x; const dy = y - this.y;
        const cos = Math.cos(-this.rotation); const sin = Math.sin(-this.rotation);
        const lx = dx * cos - dy * sin; const ly = dx * sin + dy * cos;
        return lx >= 0 && lx <= this.w && ly >= 0 && ly <= this.h;
    }
}

class Engine {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.objects = [];
        this.history = [];
        this.redoStack = [];
        this.currentTool = 'pencil';
        this.currentColor = '#000000';
        this.currentStrokeWidth = 3;
        this.currentOpacity = 1;
        this.currentFont = 'Inter';
        this.currentFontSize = 24;
        this.userName = localStorage.getItem('antigravity_username') || 'Yo (Editor)';
        
        this.recentColors = [];
        this.maxRecentColors = 7;
        
        this.isDrawing = false;
        this.isPanning = false;
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        
        this.tempObject = null;
        this.selectedObject = null;
        this.points = [];
        
        this.userActivity = {
            'user-1': Date.now() - 120000,
            'user-2': Date.now() - 600000,
            'me': Date.now()
        };

        this.roomId = new URLSearchParams(window.location.search).get('room');
        if (!this.roomId) {
            this.roomId = 'pizarra-' + Math.random().toString(36).substr(2, 9);
            const newUrl = window.location.origin + window.location.pathname + '?room=' + this.roomId;
            window.history.replaceState({path: newUrl}, '', newUrl);
        }
        this.myId = 'user-' + Math.random().toString(36).substr(2, 9);
        this.remoteCursors = {};
        
        this.setupNetwork();
        
        this.init();
    }

    setupNetwork() {
        if (!window.mqtt) {
            console.error("MQTT client not loaded");
            return;
        }
        
        this.client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
        this.topicBase = `antigravity/room/${this.roomId}`;
        
        this.client.on('connect', () => {
            console.log('Connected to MQTT broker, room:', this.roomId);
            this.client.subscribe(`${this.topicBase}/#`);
        });

        this.client.on('message', (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.creatorId === this.myId) return; // Ignore our own messages
                
                if (topic === `${this.topicBase}/draw`) {
                    this.handleRemoteObject(data);
                } else if (topic === `${this.topicBase}/cursor`) {
                    this.updateRemoteCursor(data);
                }
            } catch(e) {
                console.error("Error parsing message", e);
            }
        });

        // Broadcast cursor movement throttled
        this.lastCursorBroadcast = 0;
        window.addEventListener('pointermove', (e) => {
            const now = Date.now();
            if (now - this.lastCursorBroadcast > 50 && this.client && this.client.connected) {
                const pos = this.getMousePos(e);
                this.client.publish(`${this.topicBase}/cursor`, JSON.stringify({
                    creatorId: this.myId,
                    name: this.userName,
                    color: this.currentColor,
                    x: pos.x,
                    y: pos.y
                }), { qos: 0 });
                this.lastCursorBroadcast = now;
            }
        });
    }

    updateRemoteCursor(data) {
        let cursorEl = this.remoteCursors[data.creatorId];
        if (!cursorEl) {
            cursorEl = document.createElement('div');
            cursorEl.className = 'remote-cursor';
            cursorEl.innerHTML = `
                <svg class="remote-cursor-icon" viewBox="0 0 24 24" fill="${data.color}"><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.7z" stroke="white" stroke-width="1"/></svg>
                <div class="remote-cursor-label" style="background-color: ${data.color}">${data.name}</div>
            `;
            document.getElementById('canvas-container').appendChild(cursorEl);
            this.remoteCursors[data.creatorId] = cursorEl;
        } else {
            // Update color/name if changed
            cursorEl.querySelector('.remote-cursor-icon').setAttribute('fill', data.color);
            const label = cursorEl.querySelector('.remote-cursor-label');
            label.innerText = data.name;
            label.style.backgroundColor = data.color;
        }
        
        // Update position (convert world to screen)
        const screenX = (data.x * this.zoom) + this.panX;
        const screenY = (data.y * this.zoom) + this.panY;
        cursorEl.style.transform = `translate(${screenX}px, ${screenY}px)`;
        
        // Update activity
        this.userActivity[data.creatorId] = Date.now();
        this.updateActivityUI();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.setupEvents();
        this.setupToolbar();
        this.setupColorWheel();
        this.render();
        
        setInterval(() => this.updateActivityUI(), 10000);
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.render();
    }

    setupEvents() {
        const container = document.getElementById('canvas-container');
        const cursor = document.getElementById('custom-cursor');

        container.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        window.addEventListener('pointermove', (e) => {
            this.handlePointerMove(e);
            // Move cursor
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });
        window.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        
        // Image input
        document.getElementById('image-input').addEventListener('change', (e) => this.handleImageUpload(e));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.panX) / this.zoom,
            y: (e.clientY - rect.top - this.panY) / this.zoom
        };
    }

    handlePointerDown(e) {
        const pos = this.getMousePos(e);
        this.isDrawing = true;
        this.points = [pos];

        if (this.currentTool === 'pan') {
            this.isPanning = true;
            this.lastPan = { x: e.clientX, y: e.clientY };
            return;
        }

        if (this.currentTool === 'select') {
            const hit = this.objects.slice().reverse().find(obj => {
                if (obj.selected && obj.isRotationHandleHit && obj.isRotationHandleHit(pos.x, pos.y)) {
                    this.isRotating = true;
                    this.selectedObject = obj;
                    return true;
                }
                return obj.isHit(pos.x, pos.y, this.ctx);
            });

            if (hit) {
                this.selectedObject = hit;
                this.objects.forEach(o => o.selected = (o === hit));
                if (!this.isRotating) {
                    this.dragOffset = { x: pos.x - hit.x, y: pos.y - hit.y };
                }
            } else {
                this.selectedObject = null;
                this.objects.forEach(o => o.selected = false);
            }
            this.render();
            return;
        }

        if (this.currentTool === 'fill') {
            this.handleFloodFill(e);
            return;
        }
        
        if (this.currentTool === 'text') {
            const text = prompt('Ingrese el texto:');
            if (text) {
                const obj = new TextObject(pos.x, pos.y, text, this.currentFont, this.currentFontSize, this.currentColor);
                this.addObject(obj);
            }
            this.isDrawing = false;
            return;
        }
    }

    handlePointerMove(e) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(e);

        if (this.isPanning) {
            this.panX += e.clientX - this.lastPan.x;
            this.panY += e.clientY - this.lastPan.y;
            this.lastPan = { x: e.clientX, y: e.clientY };
            
            // Update CSS Grid Offset
            const container = document.getElementById('canvas-container');
            container.style.setProperty('--grid-offset-x', `${this.panX}px`);
            container.style.setProperty('--grid-offset-y', `${this.panY}px`);
            
            this.render();
            return;
        }

        if (this.selectedObject) {
            if (this.isRotating) {
                const angle = Math.atan2(pos.y - this.selectedObject.y, pos.x - this.selectedObject.x);
                this.selectedObject.rotation = angle + Math.PI / 2;
            } else {
                this.selectedObject.x = pos.x - this.dragOffset.x;
                this.selectedObject.y = pos.y - this.dragOffset.y;
            }
            this.render();
            return;
        }

        this.points.push(pos);
        
        const op = this.currentOpacity;
        switch (this.currentTool) {
            case 'pencil':
                this.tempObject = new StrokeObject(this.points, this.currentColor, this.currentStrokeWidth / this.zoom, op);
                break;
            case 'eraser':
                this.tempObject = new EraserObject(this.points, (this.currentStrokeWidth * 4) / this.zoom);
                break;
            case 'rect':
                const startR = this.points[0];
                this.tempObject = new RectObject(startR.x, startR.y, pos.x - startR.x, pos.y - startR.y, this.currentColor, this.currentStrokeWidth / this.zoom, false, op);
                break;
            case 'circle':
                const startC = this.points[0];
                const r = Math.sqrt(Math.pow(pos.x - startC.x, 2) + Math.pow(pos.y - startC.y, 2));
                this.tempObject = new CircleObject(startC.x, startC.y, r, this.currentColor, this.currentStrokeWidth / this.zoom, false, op);
                break;
            case 'line':
                const startL = this.points[0];
                this.tempObject = new LineObject(startL.x, startL.y, pos.x, pos.y, this.currentColor, this.currentStrokeWidth / this.zoom, op);
                break;
        }
        this.render();
    }

    handlePointerUp() {
        if (this.tempObject && this.isDrawing) {
            this.addObject(this.tempObject);
            this.userActivity['me'] = Date.now();
            this.updateActivityUI();
        }
        this.isDrawing = false;
        this.isPanning = false;
        this.isRotating = false;
        this.tempObject = null;
        this.render();
    }

    addObject(obj, isRemote = false) {
        this.objects.push(obj);
        if (!isRemote) {
            this.broadcastObject(obj);
            this.saveState();
        }
        this.render();
    }

    broadcastObject(obj) {
        if (!this.client || !this.client.connected) return;
        obj.creatorId = this.myId;
        // Serialize object for broadcasting
        const data = JSON.stringify(obj, (key, value) => {
            if (key === 'img') return value.src;
            return value;
        });
        this.client.publish(`${this.topicBase}/draw`, data, { qos: 1 });
    }

    handleRemoteObject(data) {
        const objects = this.deserialize(JSON.stringify([data]));
        if (objects.length > 0) {
            this.addObject(objects[0], true);
            
            // Add user if not exists or update activity
            const creatorId = data.creatorId || 'remote-user';
            this.userActivity[creatorId] = Date.now();
            this.updateActivityUI();
        }
    }

    saveState() {
        this.history.push(JSON.stringify(this.objects, (key, value) => {
            if (key === 'img') return value.src; // Handle image serialization
            return value;
        }));
        this.redoStack = [];
    }

    undo() {
        if (this.history.length > 0) {
            const current = this.history.pop();
            this.redoStack.push(current);
            const last = this.history[this.history.length - 1];
            this.objects = last ? this.deserialize(last) : [];
            this.render();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop();
            this.history.push(state);
            this.objects = this.deserialize(state);
            this.render();
        }
    }

    deserialize(json) {
        const data = JSON.parse(json);
        return data.map(o => {
            let obj;
            const op = o.opacity !== undefined ? o.opacity : 1;
            switch(o.type) {
                case 'stroke': obj = new StrokeObject(o.points, o.color, o.strokeWidth, op); break;
                case 'eraser': obj = new EraserObject(o.points, o.strokeWidth); break;
                case 'rect': obj = new RectObject(o.x, o.y, o.w, o.h, o.color, o.strokeWidth, o.fill, op); break;
                case 'circle': obj = new CircleObject(o.x, o.y, o.r, o.color, o.strokeWidth, o.fill, op); break;
                case 'line': obj = new LineObject(o.x, o.y, o.x + o.dx, o.y + o.dy, o.color, o.strokeWidth, op); break;
                case 'text': obj = new TextObject(o.x, o.y, o.text, o.font, o.size, o.color, op); break;
                case 'image': 
                    const img = new Image();
                    img.src = o.img;
                    obj = new ImageObject(o.x, o.y, img);
                    img.onload = () => this.render();
                    break;
            }
            if (obj) {
                obj.rotation = o.rotation;
                obj.selected = o.selected;
                obj.x = o.x;
                obj.y = o.y;
                obj.creatorId = o.creatorId || 'me';
            }
            return obj;
        });
    }

    render() {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid is now handled by CSS background for performance

        // Offscreen drawing for objects to handle eraser correctly
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.canvas.width;
        offCanvas.height = this.canvas.height;
        const offCtx = offCanvas.getContext('2d');
        
        offCtx.save();
        offCtx.translate(this.panX * dpr, this.panY * dpr);
        offCtx.scale(this.zoom * dpr, this.zoom * dpr);

        this.objects.forEach(obj => obj.draw(offCtx));
        if (this.tempObject) this.tempObject.draw(offCtx);
        offCtx.restore();

        this.ctx.drawImage(offCanvas, 0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    }



    setupToolbar() {
        const btns = document.querySelectorAll('.tool-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id.startsWith('tool-')) {
                    btns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentTool = btn.id.replace('tool-', '');
                    
                    // Deselect objects when switching tools
                    if (this.currentTool !== 'select') {
                        this.objects.forEach(o => o.selected = false);
                        this.selectedObject = null;
                        this.render();
                    }
                    
                    document.getElementById('font-settings').classList.toggle('hidden', this.currentTool !== 'text');
                    
                    if (this.currentTool === 'image') {
                        document.getElementById('image-input').click();
                    }
                }
            });
        });

        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        
        document.getElementById('stroke-width').addEventListener('input', (e) => {
            this.currentStrokeWidth = parseInt(e.target.value);
            document.getElementById('stroke-width-value').innerText = `${this.currentStrokeWidth}px`;
        });

        document.getElementById('opacity-slider').addEventListener('input', (e) => {
            this.currentOpacity = parseInt(e.target.value) / 100;
            document.getElementById('opacity-value').innerText = `${e.target.value}%`;
        });

        document.getElementById('font-family').addEventListener('change', (e) => this.currentFont = e.target.value);
        document.getElementById('font-size').addEventListener('input', (e) => this.currentFontSize = parseInt(e.target.value));
        
        // People Jump Logic
        document.querySelectorAll('.jump-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const personId = e.currentTarget.closest('.person-item').dataset.id;
                this.jumpToLastObjectOfCreator(personId);
            });
        });
        
        document.getElementById('toggle-people-btn').addEventListener('click', () => {
            const panel = document.getElementById('people-panel');
            panel.classList.toggle('collapsed');
        });

        document.getElementById('share-btn').addEventListener('click', () => this.showShareModal());
        document.getElementById('close-modal-btn').addEventListener('click', () => document.getElementById('share-modal').classList.add('hidden'));
        
        document.getElementById('edit-name-btn').addEventListener('click', () => this.changeMyName());
        document.getElementById('my-name-display').innerText = this.userName;
        
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            const link = document.getElementById('share-link-text').href;
            const tempInput = document.createElement('input');
            tempInput.value = link;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('Link copiado!');
        });
    }

    setupColorWheel() {
        const wheel = document.getElementById('color-wheel');
        const wheelCtx = wheel.getContext('2d');
        const display = document.getElementById('color-display');
        const container = document.getElementById('color-picker-container');
        
        const radius = wheel.width / 2;
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = (angle - 2) * Math.PI / 180;
            const endAngle = angle * Math.PI / 180;
            wheelCtx.beginPath();
            wheelCtx.moveTo(radius, radius);
            wheelCtx.arc(radius, radius, radius, startAngle, endAngle);
            wheelCtx.closePath();
            const gradient = wheelCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
            wheelCtx.fillStyle = gradient;
            wheelCtx.fill();
        }

        display.addEventListener('click', () => container.classList.toggle('hidden'));
        
        // Swatches
        document.querySelectorAll('.swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.dataset.color;
                this.updateColor(color);
            });
        });

        wheel.addEventListener('mousedown', (e) => {
            const rect = wheel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pixel = wheelCtx.getImageData(x, y, 1, 1).data;
            const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            this.updateColor(color);
            this.addToRecentColors(color);
        });
    }

    updateColor(color) {
        this.currentColor = color;
        document.getElementById('color-display').style.backgroundColor = color;
        document.getElementById('cursor-pencil').setAttribute('fill', color);
    }

    addToRecentColors(color) {
        if (this.recentColors.includes(color)) return;
        this.recentColors.unshift(color);
        if (this.recentColors.length > this.maxRecentColors) {
            this.recentColors.pop();
        }
        this.updateRecentColorsUI();
    }

    updateRecentColorsUI() {
        const container = document.getElementById('recent-colors');
        container.innerHTML = '';
        this.recentColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'swatch';
            swatch.style.background = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => this.updateColor(color));
            container.appendChild(swatch);
        });
    }

    updateActivityUI() {
        for (const [userId, timestamp] of Object.entries(this.userActivity)) {
            const el = document.getElementById(`activity-${userId}`);
            if (el) {
                el.innerText = this.formatRelativeTime(timestamp);
            }
        }
    }

    formatRelativeTime(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'ahora mismo';
        if (mins === 1) return 'hace 1 min';
        return `hace ${mins} min`;
    }

    changeMyName() {
        const newName = prompt('Ingrese su nuevo nombre:', this.userName);
        if (newName && newName.trim() !== '') {
            this.userName = newName.trim();
            localStorage.setItem('antigravity_username', this.userName);
            document.getElementById('my-name-display').innerText = this.userName;
        }
    }

    jumpToLastObjectOfCreator(creatorId) {
        const obj = this.objects.slice().reverse().find(o => o.creatorId === creatorId);
        if (obj) {
            this.panX = -obj.x + (this.canvas.width / 2 / (window.devicePixelRatio || 1));
            this.panY = -obj.y + (this.canvas.height / 2 / (window.devicePixelRatio || 1));
            
            // Highlight briefly instead of persistent selection
            obj.selected = true;
            this.render();
            setTimeout(() => {
                obj.selected = false;
                this.render();
            }, 2000);
        } else {
            // If no objects yet, let's create a dummy one for the simulated users to jump to
            if (creatorId !== 'me') {
                const dummy = new RectObject(Math.random() * 500, Math.random() * 500, 100, 100, '#3b82f6', 2);
                dummy.creatorId = creatorId;
                this.addObject(dummy);
                this.jumpToLastObjectOfCreator(creatorId);
            }
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const obj = new ImageObject(100, 100, img);
                this.addObject(obj);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleFloodFill(e) {
        const rect = this.canvas.getBoundingClientRect();
        const startX = Math.round(e.clientX - rect.left);
        const startY = Math.round(e.clientY - rect.top);

        // Get current canvas state
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw everything to temp canvas
        this.ctx.save(); // Don't use current scale, we want absolute pixels
        this.objects.forEach(obj => obj.draw(tempCtx));
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pixels = imageData.data;
        
        const dpr = window.devicePixelRatio || 1;
        const targetX = Math.round(startX * dpr);
        const targetY = Math.round(startY * dpr);
        
        const targetOffset = (targetY * imageData.width + targetX) * 4;
        const targetColor = [pixels[targetOffset], pixels[targetOffset+1], pixels[targetOffset+2], pixels[targetOffset+3]];
        
        const fillColor = this.parseColor(this.currentColor);
        if (this.colorsMatch(targetColor, fillColor)) return;

        // Simple Scanline Flood Fill
        const stack = [[targetX, targetY]];
        const filledPixels = new Uint8ClampedArray(imageData.width * imageData.height * 4);
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            let currentOffset = (y * imageData.width + x) * 4;
            
            while (y >= 0 && this.colorsMatch(this.getPixel(pixels, x, y, imageData.width), targetColor)) {
                y--;
            }
            y++;
            
            let reachLeft = false;
            let reachRight = false;
            
            while (y < imageData.height && this.colorsMatch(this.getPixel(pixels, x, y, imageData.width), targetColor)) {
                const offset = (y * imageData.width + x) * 4;
                pixels[offset] = fillColor[0];
                pixels[offset+1] = fillColor[1];
                pixels[offset+2] = fillColor[2];
                pixels[offset+3] = 255;
                
                filledPixels[offset] = fillColor[0];
                filledPixels[offset+1] = fillColor[1];
                filledPixels[offset+2] = fillColor[2];
                filledPixels[offset+3] = 255;

                if (x > 0) {
                    if (this.colorsMatch(this.getPixel(pixels, x-1, y, imageData.width), targetColor)) {
                        if (!reachLeft) {
                            stack.push([x-1, y]);
                            reachLeft = true;
                        }
                    } else if (reachLeft) {
                        reachLeft = false;
                    }
                }
                
                if (x < imageData.width - 1) {
                    if (this.colorsMatch(this.getPixel(pixels, x+1, y, imageData.width), targetColor)) {
                        if (!reachRight) {
                            stack.push([x+1, y]);
                            reachRight = true;
                        }
                    } else if (reachRight) {
                        reachRight = false;
                    }
                }
                y++;
            }
        }
        
        const fillImgData = new ImageData(filledPixels, imageData.width, imageData.height);
        const obj = new FillObject(0, 0, fillImgData, imageData.width, imageData.height, this.currentColor);
        this.addObject(obj);
    }

    getPixel(pixels, x, y, width) {
        const offset = (y * width + x) * 4;
        return [pixels[offset], pixels[offset+1], pixels[offset+2], pixels[offset+3]];
    }

    colorsMatch(c1, c2) {
        return Math.abs(c1[0] - c2[0]) < 5 && Math.abs(c1[1] - c2[1]) < 5 && Math.abs(c1[2] - c2[2]) < 5 && Math.abs(c1[3] - c2[3]) < 5;
    }

    parseColor(color) {
        const dummy = document.createElement('div');
        dummy.style.color = color;
        document.body.appendChild(dummy);
        const style = getComputedStyle(dummy).color;
        const match = style.match(/\d+/g);
        document.body.removeChild(dummy);
        return match ? match.map(Number).concat([255]) : [0,0,0,255];
    }

    showShareModal() {
        const state = JSON.stringify(this.objects, (key, value) => {
            if (key === 'img') return value.src;
            return value;
        });
        const encoded = btoa(unescape(encodeURIComponent(state)));
        const url = window.location.origin + window.location.pathname + '?room=' + this.roomId + '&state=' + encoded;
        const linkEl = document.getElementById('share-link-text');
        linkEl.href = url;
        linkEl.innerText = url;
        document.getElementById('share-modal').classList.remove('hidden');
    }

    loadFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const state = params.get('state');
        if (state) {
            try {
                const decoded = decodeURIComponent(escape(atob(state)));
                this.objects = this.deserialize(decoded);
                this.render();
            } catch(e) {
                console.error("Error decoding state", e);
            }
        }
    }
}

window.onload = () => {
    const engine = new Engine();
    engine.loadFromUrl();
};
