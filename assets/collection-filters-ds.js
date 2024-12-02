window.addEventListener('DOMContentLoaded', () => {
  const debounce = (callback, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => callback(...args), delay);
    };
  };

  const updateURL = ({ searchParams }) => {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams ? '?' + searchParams : ''}`);
  };

  const fetchSection = async ({ sectionId, searchParams }) => {
    const url = `${window.location.pathname}?section_id=${sectionId}&${searchParams}`;

    try {
      const request = await fetch(url);
      const sectionHTML = await request.text();
      const parsedSection = new DOMParser().parseFromString(sectionHTML, 'text/html');

      return parsedSection;
    } catch (error) {
      console.error(error);
    }
  };

  const renderElement = ({ parsedSection, selector }) => {
    const targetElement = document?.querySelector(selector);
    const content = parsedSection?.querySelector(selector);
    if (!targetElement || !content) return;

    targetElement.innerHTML = content.innerHTML;
  };

  const renderFilters = ({ parsedSection, event }) => {
    const isEventTargetFilter = (element) => {
      const eventTarget = event?.target?.closest(selectors.filterItem);
      return eventTarget?.id === element.id;
    };

    const filterItems = parsedSection.querySelectorAll(selectors.filterItem);
    const filtersToRender = [...filterItems].filter((element) => !isEventTargetFilter(element));

    filtersToRender.forEach((element) => {
      const targetElement = document.getElementById(element.id);
      if (targetElement) {
        targetElement.innerHTML = element.innerHTML;
      }
    });
  };

  const renderPage = async ({ searchParams = '', event }) => {
    const { sectionId } = document.querySelector(selectors.productsContainer)?.dataset ?? {};
    if (!sectionId) return;

    const parsedSection = await fetchSection({ sectionId, searchParams });
    renderElement({ parsedSection, selector: selectors.productsContainer });
    renderElement({ parsedSection, selector: selectors.formSort });
    renderElement({ parsedSection, selector: selectors.activeFiltersContainer });
    renderFilters({ parsedSection, event });
    updateURL({ searchParams });
  };

  const initEventListeners = () => {
    const formFilters = document.querySelector(selectors.formFilters);
    const formSort = document.querySelector(selectors.formSort);
    const activeFiltersContainer = document.querySelector(selectors.activeFiltersContainer);

    const onFormSubmit = debounce((event) => {
      event.preventDefault();

      const createSearchParams = ({ form }) => {
        return new URLSearchParams(new FormData(form));
      };

      const combinedParams = new URLSearchParams([
        ...createSearchParams({ form: formSort }),
        ...createSearchParams({ form: formFilters }),
      ]);

      renderPage({ searchParams: combinedParams.toString(), event });
    }, 300);

    const onActiveFilterClick = (event) => {
      const removeFilterLink = event.target.closest(selectors.removeFilterLink);
      if (!removeFilterLink) return;

      event.preventDefault();
      const searchParams = removeFilterLink.href.includes('?') ? removeFilterLink.href.split('?')[1] : '';
      renderPage({ searchParams });
    };

    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : window.location.search.slice(1);
      renderPage(searchParams);
    };

    formFilters?.addEventListener('input', onFormSubmit);
    formSort?.addEventListener('change', onFormSubmit);
    activeFiltersContainer?.addEventListener('click', onActiveFilterClick);
    window.addEventListener('popstate', onHistoryChange);
  };

  const selectors = {
    formFilters: 'form#collection-filters',
    formSort: 'form#collection-sort',
    activeFiltersContainer: '.js-active-filters-container',
    filterItem: '.js-filter-item',
    removeFilterLink: '.js-remove-filter',
    productsContainer: '.js-products-container',
  };

  initEventListeners();
});
