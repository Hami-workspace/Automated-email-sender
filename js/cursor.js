document.addEventListener("DOMContentLoaded", function() {
    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        * {
            cursor: none !important;
        }

        .custom-cursor-dot {
            position: fixed;
            top: 0;
            left: 0;
            width: 10px;
            height: 10px;
            background-color: #00e5ff;
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999999;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px #00e5ff;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .custom-cursor-outline {
            position: fixed;
            top: 0;
            left: 0;
            width: 45px;
            height: 45px;
            border: 2px solid rgba(0, 229, 255, 0.7);
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999998;
            transform: translate(-50%, -50%);
            transition: width 0.2s ease, height 0.2s ease, background-color 0.2s ease, opacity 0.2s;
            opacity: 0;
        }
    `;
    document.head.appendChild(style);

    // Create Cursor Elements
    const dot = document.createElement("div");
    dot.className = "custom-cursor-dot";
    document.body.appendChild(dot);

    const outline = document.createElement("div");
    outline.className = "custom-cursor-outline";
    document.body.appendChild(outline);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outlineX = mouseX;
    let outlineY = mouseY;
    let isVisible = false;

    window.addEventListener("mousemove", function(e) {
        if (!isVisible) {
            dot.style.opacity = 1;
            outline.style.opacity = 1;
            isVisible = true;
        }
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    document.addEventListener("mouseout", function(e) {
        if (e.relatedTarget === null) {
            dot.style.opacity = 0;
            outline.style.opacity = 0;
            isVisible = false;
        }
    });

    document.addEventListener("mouseenter", function() {
        dot.style.opacity = 1;
        outline.style.opacity = 1;
        isVisible = true;
    });

    // Animate outline to follow dot with slight delay
    function animate() {
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;
        
        outline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animate);
    }
    animate();
    
    // Add hover effects for interactive elements
    const applyHover = () => {
        const clickables = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        clickables.forEach(el => {
            if (el.dataset.cursorHoverAttached) return;
            el.dataset.cursorHoverAttached = "true";
            
            el.addEventListener('mouseenter', () => {
                outline.style.width = '60px';
                outline.style.height = '60px';
                outline.style.backgroundColor = 'rgba(0, 229, 255, 0.1)';
            });
            el.addEventListener('mouseleave', () => {
                outline.style.width = '45px';
                outline.style.height = '45px';
                outline.style.backgroundColor = 'transparent';
            });
        });
    };

    // Small delay to ensure DOM is fully loaded elements
    setTimeout(applyHover, 100);

    // Re-apply hover effect if DOM changes (e.g. dynamic content)
    const observer = new MutationObserver(applyHover);
    observer.observe(document.body, { childList: true, subtree: true });
});
