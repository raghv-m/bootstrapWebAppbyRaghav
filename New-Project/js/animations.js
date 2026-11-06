// UpChances motion.
// Three jobs, all defensive:
//  1. Scroll reveals that can never leave a section blank. Elements
//     fade in fast (CSS keeps it to 0.45s), anything already scrolled
//     past is revealed immediately, a scroll safety net catches
//     anything the observer missed, and a timed failsafe reveals
//     whatever is left. Under prefers-reduced-motion nothing is
//     ever hidden in the first place.
//  2. Hero carousel manners: pause while touched or focused, and
//     park on the first slide for reduced-motion readers.
//  3. Mobile nav manners: tapping a link in the open menu closes
//     the menu, instead of leaving it hanging over the section.
(function () {
    "use strict";

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- Hero carousel ---- */
    var carouselEl = document.getElementById("heroCarousel");
    if (carouselEl && window.bootstrap && window.bootstrap.Carousel) {
        var carousel = window.bootstrap.Carousel.getOrCreateInstance(carouselEl, {
            interval: 6000,
            pause: "hover",
            ride: !prefersReduced,
            touch: true,
            wrap: true
        });

        if (prefersReduced) {
            carousel.pause();
        } else {
            var resumeTimer = null;
            var hold = function () {
                window.clearTimeout(resumeTimer);
                carousel.pause();
            };
            var release = function () {
                window.clearTimeout(resumeTimer);
                resumeTimer = window.setTimeout(function () {
                    carousel.cycle();
                }, 2500);
            };
            carouselEl.addEventListener("touchstart", hold, { passive: true });
            carouselEl.addEventListener("touchend", release, { passive: true });
            carouselEl.addEventListener("focusin", hold);
            carouselEl.addEventListener("focusout", release);
        }
    }

    /* ---- Mobile nav: a tapped link closes the open menu ---- */
    // On phones the collapse panel would otherwise stay open after
    // the jump and cover the section the reader just asked for. Any
    // link inside it (nav links and the CTA alike) closes it; the
    // browser's own anchor jump still runs, and the CSS
    // scroll-margin-top keeps the landing clear of the sticky bar.
    // On desktop the panel never carries .show, so this is a no-op
    // there. Bootstrap's hide() also resets the toggler's
    // aria-expanded and .collapsed class, so the button state stays
    // truthful.
    var navCollapse = document.getElementById("navbarNav");
    if (navCollapse) {
        navCollapse.addEventListener("click", function (event) {
            if (!event.target.closest("a") || !navCollapse.classList.contains("show")) {
                return;
            }
            if (window.bootstrap && window.bootstrap.Collapse) {
                window.bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
            } else {
                // Bootstrap bundle missing: drop the open state by
                // hand and reset the toggler so it tells the truth,
                // rather than throwing and leaving the menu stuck.
                navCollapse.classList.remove("show", "collapsing");
                navCollapse.style.removeProperty("height");
                var togglers = document.querySelectorAll('[data-bs-target="#navbarNav"]');
                Array.prototype.forEach.call(togglers, function (toggler) {
                    toggler.classList.add("collapsed");
                    toggler.setAttribute("aria-expanded", "false");
                });
            }
        });
    }

    /* ---- Scroll reveal ---- */
    var root = document.documentElement;
    root.classList.add("js");

    if (prefersReduced || !("IntersectionObserver" in window)) {
        // Nothing gets tagged .reveal, so nothing is hidden.
        return;
    }

    var selectors = [
        ".hero .eyebrow",
        ".hero-title",
        ".hero-lead",
        ".hero .d-flex",
        ".hero-note",
        ".hero-card",
        ".section-head",
        ".program-card",
        ".step-card",
        ".involve-card",
        "#about .eyebrow",
        ".about-title",
        ".about-text",
        ".about-point",
        "#contact .eyebrow",
        ".contact-title",
        "#contact .section-lead",
        ".contact-list",
        ".contact-form"
    ];

    var elements = Array.prototype.slice.call(document.querySelectorAll(selectors.join(", ")));
    if (!elements.length) {
        return;
    }

    // Tag the elements, with a small stagger for ones that share a
    // row (or a parent) so card groups ease in one after another.
    var groupCounts = new Map();
    elements.forEach(function (el) {
        el.classList.add("reveal");
        var group = el.closest(".row") || el.parentElement;
        var index = groupCounts.get(group) || 0;
        groupCounts.set(group, index + 1);
        el.style.transitionDelay = Math.min(index * 60, 240) + "ms";
    });

    var pending = new Set(elements);

    function reveal(el) {
        if (!pending.has(el)) {
            return;
        }
        pending.delete(el);
        el.classList.add("in-view");
        observer.unobserve(el);
        // Clear the stagger delay once the reveal has played, so
        // hover transitions on the cards respond instantly afterwards.
        window.setTimeout(function () {
            el.style.transitionDelay = "0ms";
        }, 700);
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            // Reveal anything in view OR already above the viewport:
            // a fast scroll can carry an element clean past the
            // visible strip between two observer frames, and it must
            // not be left blank because of that.
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                reveal(entry.target);
            }
        });
    }, {
        threshold: 0,
        rootMargin: "0px 0px 8% 0px"
    });

    elements.forEach(function (el) {
        observer.observe(el);
    });

    // Safety net: on scroll, reveal anything that is on screen or
    // above it but has not been revealed yet.
    var ticking = false;
    function sweep() {
        ticking = false;
        pending.forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight) {
                reveal(el);
            }
        });
        if (!pending.size) {
            window.removeEventListener("scroll", onScroll);
        }
    }
    function onScroll() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(sweep);
        }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // Failsafe: three seconds after load, nothing stays hidden,
    // whatever happened on the way there.
    window.addEventListener("load", function () {
        window.setTimeout(function () {
            pending.forEach(reveal);
            window.removeEventListener("scroll", onScroll);
        }, 3000);
    });
})();
