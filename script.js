/* ========================================
   PORTFOLIO — DVIJ JOSHI
   Scroll animations & interactivity
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Scroll Reveal (Intersection Observer) ----
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // ---- Navbar scroll behavior + Back to Top ----
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Back to top visibility
    if (backToTop) {
      if (currentScroll > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  }, { passive: true });


  // ---- Active nav link highlighting ----
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  const highlightNav = () => {
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();


  // ---- Mobile nav toggle ----
  const navToggle = document.getElementById('navToggle');
  const navLinksContainer = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
      navToggle.classList.toggle('active');
    });

    // Close mobile nav on link click
    navLinksContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('open');
        navToggle.classList.remove('active');
      });
    });
  }


  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });


  // ---- Parallax on hero floating shapes ----
  const floatingShapes = document.querySelector('.floating-shapes');
  const heroSection = document.querySelector('.hero');

  if (floatingShapes && heroSection) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const heroHeight = heroSection.offsetHeight;

      if (scrolled < heroHeight) {
        const rate = scrolled * 0.3;
        floatingShapes.style.transform = `translateY(${rate}px)`;
      }
    }, { passive: true });
  }


  // ---- Project card tilt effect on mouse move ----
  const projectShowcases = document.querySelectorAll('.project-showcase');

  projectShowcases.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -2;
      const rotateY = ((x - centerX) / centerX) * 2;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });


  // ---- Stacking cards scroll progress ----
  const stackContainer = document.querySelector('.projects-stack');
  if (stackContainer) {
    const stackCards = stackContainer.querySelectorAll('.project-showcase');

    // Add progressive z-index so later cards appear on top
    stackCards.forEach((card, i) => {
      card.style.zIndex = i + 1;
    });

    // Slight scale-down effect for buried cards
    const handleStackScroll = () => {
      const containerRect = stackContainer.getBoundingClientRect();

      stackCards.forEach((card, i) => {
        const cardRect = card.getBoundingClientRect();
        const cardTop = cardRect.top;

        // When a card is stuck at the top
        if (cardTop <= 82 && i < stackCards.length - 1) {
          // Calculate how far the next card has scrolled over this one
          const nextCard = stackCards[i + 1];
          const nextRect = nextCard.getBoundingClientRect();
          const overlap = Math.max(0, 82 + cardRect.height - nextRect.top);
          const progress = Math.min(1, overlap / (cardRect.height * 0.4));

          const scale = 1 - (progress * 0.04);
          const brightness = 1 - (progress * 0.15);
          card.style.transform = `scale(${scale})`;
          card.style.filter = `brightness(${brightness})`;
        } else {
          card.style.transform = '';
          card.style.filter = '';
        }
      });
    };

    window.addEventListener('scroll', handleStackScroll, { passive: true });
  }


  // ---- Skill tags stagger on hover ----
  const skillCategories = document.querySelectorAll('.skill-category');

  skillCategories.forEach(cat => {
    const tags = cat.querySelectorAll('.skill-tag');

    cat.addEventListener('mouseenter', () => {
      tags.forEach((tag, i) => {
        tag.style.transitionDelay = `${i * 0.04}s`;
        tag.style.transform = 'translateY(-3px)';
      });
    });

    cat.addEventListener('mouseleave', () => {
      tags.forEach(tag => {
        tag.style.transitionDelay = '0s';
        tag.style.transform = 'translateY(0)';
      });
    });
  });


  // ---- Contact form submission (visual only) ----
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('.btn');
      const originalText = btn.innerHTML;

      btn.innerHTML = '✓ Message Sent!';
      btn.style.background = 'var(--mint-deep)';
      btn.style.pointerEvents = 'none';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.pointerEvents = '';
        contactForm.reset();
      }, 2500);
    });
  }


  // ---- Typed text effect for hero greeting ----
  const greeting = document.querySelector('.hero-greeting');
  if (greeting) {
    const originalText = greeting.textContent;
    greeting.textContent = '';
    greeting.classList.add('visible');
    greeting.style.opacity = '1';
    greeting.style.transform = 'none';

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < originalText.length) {
        greeting.textContent += originalText.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);
  }


  // ---- Magnetic effect on CTA buttons ----
  const magneticBtns = document.querySelectorAll('.btn-primary');

  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });


  // ---- Add subtle page-load animation ----
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.6s ease';

  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

});
