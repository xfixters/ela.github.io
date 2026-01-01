document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid");
    const progressText = document.getElementById("progress-text");
    const progressFill = document.getElementById("progress-fill");
    const creditsText = document.getElementById("credits-text");

    // ===== CARGAR RAMOS APROBADOS DESDE LOCALSTORAGE =====
    let approved = [];
    try {
        approved = JSON.parse(localStorage.getItem("approvedCourses")) || [];
    } catch (e) {
        approved = [];
    }

    // ===== LISTA COMPLETA DE RAMOS =====
    const allCourses = [];
    const courseMap = {};

    for (let sem in semesters) {
        semesters[sem].forEach(course => {
            allCourses.push(course.code);
            courseMap[course.code] = course;
        });
    }

    // ===== LIMPIEZA AUTOMÁTICA (POR SI CAMBIAS DATA) =====
    approved = approved.filter(code => allCourses.includes(code));
    localStorage.setItem("approvedCourses", JSON.stringify(approved));

    // ===== VALIDAR PRERREQUISITOS =====
    function isUnlocked(course) {
        if (!course.prereq || course.prereq.length === 0) {
            return true;
        }
        return course.prereq.every(req => approved.includes(req));
    }

    // ===== DESAPROBACIÓN EN CASCADA =====
    function removeWithDependents(code) {
        const toRemove = new Set();
        toRemove.add(code);

        let changed = true;
        while (changed) {
            changed = false;

            approved.forEach(c => {
                const prereq = courseMap[c]?.prereq || [];
                if (prereq.some(p => toRemove.has(p)) && !toRemove.has(c)) {
                    toRemove.add(c);
                    changed = true;
                }
            });
        }

        approved = approved.filter(c => !toRemove.has(c));
    }

    // ===== CÁLCULO DE CRÉDITOS =====
    function calculateApprovedCredits() {
        let total = 0;
        for (let sem in semesters) {
            semesters[sem].forEach(course => {
                if (approved.includes(course.code)) {
                    total += Number(course.credits) || 0;
                }
            });
        }
        return total;
    }

    function calculateTotalCredits() {
        let total = 0;
        for (let sem in semesters) {
            semesters[sem].forEach(course => {
                total += Number(course.credits) || 0;
            });
        }
        return total;
    }

    // ===== ACTUALIZAR PROGRESO =====
    function updateProgress() {
        const approvedCredits = calculateApprovedCredits();
        const totalCredits = calculateTotalCredits();

        const approvedCourses = approved.length;
        const totalCourses = allCourses.length;

        const percent = totalCredits === 0
            ? 0
            : ((approvedCredits / totalCredits) * 100).toFixed(1);

        progressFill.style.width = percent + "%";
        progressText.textContent = `Progreso: ${percent}%`;
        creditsText.innerHTML = `
            Créditos aprobados: ${approvedCredits} / ${totalCredits}<br>
            Ramos aprobados: ${approvedCourses} / ${totalCourses}
        `;
    }

    // ===== RENDER PRINCIPAL =====
    function render() {
        grid.innerHTML = "";

        for (let sem = 1; sem <= 11; sem++) {
            if (!semesters[sem]) continue;

            const semDiv = document.createElement("div");
            semDiv.className = "semester";

            const title = document.createElement("h2");
            title.textContent = `S${sem}`;
            semDiv.appendChild(title);

            semesters[sem].forEach(course => {
                const div = document.createElement("div");
                div.classList.add("course");

                // ===== COLORES POR SIGLA =====
                if (course.code.startsWith("MAT")) div.classList.add("mat");
                if (course.code.startsWith("EIE")) div.classList.add("eie");
                if (course.code.startsWith("QUI")) div.classList.add("qui");
                if (course.code.startsWith("FIS")) div.classList.add("fis");
                if (course.code.startsWith("ING")) div.classList.add("ing");
                if (course.code.startsWith("FIN")) div.classList.add("fin");
                if (course.code.startsWith("DER")) div.classList.add("der");
                if (course.code.startsWith("EII")) div.classList.add("eii");

                if (
                    course.code.startsWith("ICR") ||
                    course.code.startsWith("IER") ||
                    course.code.startsWith("FOFU")
                ) div.classList.add("rosado");

                if (course.code.startsWith("OPT")) div.classList.add("opt");

                // ===== CONTENIDO =====
                div.innerHTML = `
                    <strong>${course.code}</strong><br>
                    ${course.name}<br>
                    <small>${course.credits} créditos</small>
                `;

                const unlocked = isUnlocked(course);

                if (approved.includes(course.code)) {
                    div.classList.add("approved");
                } else if (unlocked) {
                    div.classList.add("available");
                } else {
                    div.classList.add("locked");
                }

                // ===== CLICK =====
                if (unlocked || approved.includes(course.code)) {
                    div.addEventListener("click", () => {
                        if (approved.includes(course.code)) {
                            removeWithDependents(course.code);
                        } else {
                            approved.push(course.code);
                        }

                        localStorage.setItem(
                            "approvedCourses",
                            JSON.stringify(approved)
                        );

                        render();
                    });
                }

                semDiv.appendChild(div);
            });

            grid.appendChild(semDiv);
        }

        updateProgress();
    }

    render();
});
