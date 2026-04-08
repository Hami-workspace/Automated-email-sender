/* =========================================================================
   Automate with Hami - Premium Background Animation
   Scanning Wireframe Grid / Cyber City Engine
   ========================================================================= */

class PremiumBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'premium-bg-canvas';
        this.ctx = this.canvas.getContext('2d');
        
        // Style the canvas
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '-1',
            pointerEvents: 'none',
            background: '#060608'
        });
        
        document.body.prepend(this.canvas);
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.gridSize = 60;
        this.scrollOffset = 0;
        this.dots = [];
        this.time = 0;
        
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = this.gridColor || 'rgba(129, 140, 248, 0.05)';
        ctx.lineWidth = 1;
        
        this.scrollOffset += 0.2;
        if (this.scrollOffset >= this.gridSize) this.scrollOffset = 0;
        
        // Vertical lines
        for (let x = 0; x <= this.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        // Horizontal lines with scroll
        for (let y = this.scrollOffset; y <= this.height; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    drawCity() {
        const ctx = this.ctx;
        this.time += 0.005;
        
        // Simulated Wireframe Buildings
        const buildingWidth = 100;
        const spacing = 150;
        const buildingsCount = Math.ceil(this.width / spacing);
        
        ctx.strokeStyle = this.cityLineColor || 'rgba(129, 140, 248, 0.08)';
        ctx.lineWidth = 1;
        
        for (let i = -1; i < buildingsCount + 1; i++) {
            const xBase = i * spacing + (Math.sin(this.time) * 20);
            const heightMultiplier = (Math.sin(i * 0.5 + this.time * 0.2) * 0.5 + 1) * 200;
            
            // Draw a boxy perspective building
            const h = heightMultiplier;
            const y = this.height - 50;
            
            ctx.beginPath();
            ctx.moveTo(xBase, y);
            ctx.lineTo(xBase, y - h);
            ctx.lineTo(xBase + buildingWidth, y - h - 20);
            ctx.lineTo(xBase + buildingWidth, y - 20);
            ctx.closePath();
            ctx.stroke();
            
            // Accents
            if (i % 2 === 0) {
                ctx.fillStyle = this.cityFillColor || 'rgba(129, 140, 248, 0.02)';
                ctx.fill();
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Base gradient
        const grad = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width
        );
        grad.addColorStop(0, this.bgCenter || '#0d0d12');
        grad.addColorStop(1, this.bgEdge || '#060608');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawGrid();
        this.drawCity();
        
        requestAnimationFrame(() => this.animate());
    }

    updateThemeColors(theme) {
        if(theme === 'light') {
            this.bgCenter = '#ffffff';
            this.bgEdge = '#f8fafc';
            this.gridColor = 'rgba(0, 0, 0, 0.04)';
            this.cityLineColor = 'rgba(99, 102, 241, 0.15)';
            this.cityFillColor = 'rgba(99, 102, 241, 0.05)';
        } else if(theme === 'cosmic') {
            this.bgCenter = '#14092b';
            this.bgEdge = '#0a0515';
            this.gridColor = 'rgba(236, 72, 153, 0.1)';
            this.cityLineColor = 'rgba(236, 72, 153, 0.15)';
            this.cityFillColor = 'rgba(236, 72, 153, 0.05)';
        } else {
            this.bgCenter = '#0d0d12';
            this.bgEdge = '#060608';
            this.gridColor = 'rgba(129, 140, 248, 0.05)';
            this.cityLineColor = 'rgba(129, 140, 248, 0.08)';
            this.cityFillColor = 'rgba(129, 140, 248, 0.02)';
        }
    }
}

function injectThemeSwitcher() {
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    switcher.innerHTML = `
        <button data-id="dark" onclick="setTheme('dark')" title="Dark Mode"><i class="fa-solid fa-moon"></i></button>
        <button data-id="light" onclick="setTheme('light')" title="Light Mode"><i class="fa-solid fa-sun" style="color:#f59e0b;"></i></button>
        <button data-id="cosmic" onclick="setTheme('cosmic')" title="Cosmic Mode"><i class="fa-solid fa-meteor" style="color:#ec4899;"></i></button>
    `;
    document.body.appendChild(switcher);

    const savedTheme = localStorage.getItem('site_theme') || 'dark';
    setTheme(savedTheme);
}

window.setTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('site_theme', theme);
    
    if (window.appBackground) {
        window.appBackground.updateThemeColors(theme);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appBackground = new PremiumBackground();
    injectThemeSwitcher();
});
