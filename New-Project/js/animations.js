// UpChances scroll animations.
// Plain vanilla JavaScript: an IntersectionObserver adds .in-view to
// elements tagged .reveal, and CSS transitions do the rest.
// If this script does not run, nothing is hidden and the page reads as-is.
(function () {
    "use strict";

    var root = document.documentElement;
    root.classList.add("js");

    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
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

    var elements = document.querySelectorAll(selectors.join(", "));
    if (!elements.length) {
        return;
    }

    // Tag the elements, and stagger ones that share a row (or a parent)
    // so cards in a group ease in one after another.
    var groupCounts = new Map();
    elements.forEach(function (el) {
        el.classList.add("reveal");
        var group = el.closest(".row") || el.parentElement;
        var index = groupCounts.get(group) || 0;
        groupCounts.set(group, index + 1);
        el.style.transitionDelay = Math.min(index * 90, 450) + "ms";
    });

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }
            var el = entry.target;
            el.classList.add("in-view");
            observer.unobserve(el);
            // Clear the stagger delay once the reveal has played, so
            // hover transitions on the cards respond instantly afterwards.
            window.setTimeout(function () {
                el.style.transitionDelay = "0ms";
            }, 1200);
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px"
    });

    elements.forEach(function (el) {
        observer.observe(el);
    });
})();
