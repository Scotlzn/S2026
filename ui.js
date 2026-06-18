export default class UIManager {
    constructor(main) {
        this.main = main;

        // Reset button
        this.reset_button = document.getElementById("reset_button")
        this.reset_button.onclick = () => {
            this.main.reset();
            this.main.render();
        }

        // Navbar text
        this.ui_navbar_text = document.getElementById("navbar_text");

        // Display costs UI toggle
        this.ui_display_costs = document.getElementById("display_costs");
        this.ui_display_costs.checked = true;
        this.display_costs = this.ui_display_costs.checked;

        this.ui_display_costs.onchange = () => {
            this.display_costs = this.ui_display_costs.checked;
            this.main.pathfinding.setup(this.main.turn.player);
            this.main.render();
        }

        // Display sets UI toggle
        this.ui_display_sets = document.getElementById("display_sets");
        this.ui_display_sets.checked = true;
        this.display_sets = this.ui_display_sets.checked;

        this.ui_display_sets.onchange = () => {
            this.display_sets = this.ui_display_sets.checked;
            this.main.pathfinding.setup(this.main.turn.player);
            this.main.render();
        }

        // Dropdowns on navbar
        const dropdowns = document.querySelectorAll('.dropdown');
        const dropbuttons = document.querySelectorAll('.dropbtn');

        dropbuttons.forEach((btn, i) => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const open = dropdowns[i].classList.contains('show');
                dropdowns.forEach(d => d.classList.remove('show'));
                if (!open) { dropdowns[i].classList.add('show'); }
            });
        });

        document.addEventListener('click', () => dropdowns.forEach(d => d.classList.remove('show')));
        dropdowns.forEach(d => d.addEventListener('click', e => e.stopPropagation()));
    
    }

    updateNavbarText() {
        this.ui_navbar_text.textContent = (this.main.redTurn) ? "Red's turn" : "Blue's turn";
    }

    gameFinished() {
        const winner = (this.main.redTurn) ? "Red" : "Blue";
        this.ui_navbar_text.textContent = `${winner} won!`;
    }
}