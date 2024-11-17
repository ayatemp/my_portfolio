// Social media icon hover effect (if additional interactivity is needed)
document.querySelectorAll('.social-links img').forEach((icon) => {
    icon.addEventListener('mouseenter', () => {
        icon.style.transform = 'scale(1.2)';
    });
    icon.addEventListener('mouseleave', () => {
        icon.style.transform = 'scale(1)';
    });
});