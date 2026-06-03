// Nav scroll effect
const nav = document.getElementById('nav');
if(nav){
  window.addEventListener('scroll',()=>{
    if(window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

// Reveal animations
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12,rootMargin:'0px 0px -60px 0px'});

document.querySelectorAll('.reveal,.reveal-scale').forEach(el=>observer.observe(el));

// Menu móvil
function toggleMenu(){
  const links = document.querySelector('.nav-links');
  if(links.style.display === 'flex'){
    links.style.display = 'none';
  } else {
    links.style.display = 'flex';
    links.style.position = 'absolute';
    links.style.top = '100%';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'var(--cream)';
    links.style.flexDirection = 'column';
    links.style.padding = '30px';
    links.style.gap = '20px';
    links.style.borderBottom = '1px solid var(--line)';
  }
}

// Filtros de proyectos (si existen en la página)
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card=>{
      if(filter === 'all' || card.dataset.category === filter){
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// Form submit (demo)
const form = document.querySelector('.contact-form form');
if(form){
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    alert('¡Gracias! Hemos recibido tu mensaje. Te responderemos en menos de 24 horas.');
    form.reset();
  });
}
