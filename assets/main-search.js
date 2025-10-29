class MainSearch extends SearchForm {
  constructor() {
    super();
    this.allSearchInputs = document.querySelectorAll('input[type="search"]');
    this.setupEventListeners();
  }

  setupEventListeners() {
    let allSearchForms = [];
    this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
    this.input.addEventListener('focus', this.onInputFocus.bind(this));
    if (allSearchForms.length < 2) return;
    allSearchForms.forEach((form) => form.addEventListener('reset', this.onFormReset.bind(this)));
    this.allSearchInputs.forEach((input) => input.addEventListener('input', this.onInput.bind(this)));
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.keepInSync('', this.input);
    }
  }

  onInput(event) {
    const target = event.target;
    this.keepInSync(target.value, target);
  }

  onInputFocus() {
    const isSmallScreen = window.innerWidth < 750;
    if (isSmallScreen) {
      this.scrollIntoView({ behavior: 'smooth' });
    }
  }

  keepInSync(value, target) {
    this.allSearchInputs.forEach((input) => {
      if (input !== target) {
        input.value = value;
      }
    });
  }
}

customElements.define('main-search', MainSearch);


document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.search-modal__form input[type="search"]');
  const preSearch = document.getElementById('PreSearchContent');

  if (input && preSearch) {
    input.addEventListener('input', () => {
      if (input.value.trim() === '') {
        preSearch.classList.remove('is-hidden');
      } else {
        preSearch.classList.add('is-hidden');
      }
    });
  }
});
