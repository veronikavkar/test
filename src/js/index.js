"use strict";

//
// Variables
//

const url = "https://5ebbb8e5f2cfeb001697d05c.mockapi.io/users";
let users = [];
let filteredUsers = [];
let search = "";
let selectPage = 1;
let selectedUserId = null;

const filters = {
  registration_date: {
    name: "registration_date",
    isActive: false,
    isIncreases: false,
  },
  rating: {
    name: "rating",
    isActive: false,
    isIncreases: false,
  },
};

//
// Computed
//
/**
 * Возвращает активные фильтры.
 *
 * @return {array}
 */
const activeFilters = () =>
  Object.values(filters).filter((item) => item.isActive);

/**
 * Проверка на наличие активных фильтров и поиска.
 *
 * @return {boolean}
 */
const isClearBtnShown = () => activeFilters().length > 0 || !!search;

// Elements
const tbody = document.getElementById("tbody");
const clearButton = document.querySelector(".search__button");
const searchField = document.getElementById("search");
const filterBtns = document.querySelectorAll(".filter__btn");
const paginationBlock = document.querySelector(".pagination");
const modal = document.getElementById("modal");
const btnCloseModal = document.getElementById("close-btn");
const deleteUserBtn = document.getElementById("delete-user");

/** 
Get-запрос для получения списка пользователей. Создание и заполнение ячеек таблицы, создание пагинации.
*/
fetch(url)
  .then((resp) => resp.json())
  .then((data) => {
    data.forEach((item) => {
      item.registration_date = new Date(item.registration_date);
    });

    users = [...data];
    filteredUsers = [...data];
    createTableOfUsers(data);
    createPagination(data);
  })
  .catch(function (error) {
    console.log(error);
  });

//
// Methods
//

function createNode(element) {
  return document.createElement(element);
}

function append(parent, el) {
  return parent.appendChild(el);
}

/**
 * Обновление таблицы при сортировке, поиске и создании пагинации
 */
function updateTable() {
  sortFilter(filteredUsers);
  setClearBtnState();
  createTableOfUsers(filteredUsers);
  createPagination(filteredUsers);
}
/**
 * Поиск user по имени и email.
 *
 * @param {string} value Значение, вводимое в поле input (searchField)
 * @return {array} filteredUsers - массив уникальных значений
 */
function searchUser(value) {
  search = value;
  selectPage = 1;

  if (!value) {
    filteredUsers = [...users];
    return;
  }

  const searchResultsByUsername = filteredUsers.filter((user) => {
    return user.username.toLowerCase().includes(value.toLowerCase());
  });
  const searchResultsByEmail = filteredUsers.filter((user) => {
    return user.email.toLowerCase().includes(value.toLowerCase());
  });
  const allSearchResult = [...searchResultsByUsername, ...searchResultsByEmail];
  filteredUsers = [...new Set(allSearchResult)];
}

/**
 * Сортировка по рейтингу или дате регистрации.
 *
 * @param {array} data Массив пользователей
 */
function sortFilter(data) {
  activeFilters().forEach((filter) => {
    if (filter.isIncreases) {
      data = data.sort(function (a, b) {
        return b[filter.name] - a[filter.name];
      });
    } else {
      data = data.sort(function (a, b) {
        return a[filter.name] - b[filter.name];
      });
    }
  });
}

/**
 * Сброс фильтров.
 */
function diactivateSortFilters() {
  Object.values(filters).forEach((filter) => {
    filter.isActive = false;
  });

  filterBtns.forEach((filterBtn) => {
    filterBtn.classList.remove("active-btn");
  });
}

/**
 * Показывает/скрывает кнопку "очистить фильтра" в зависимости от значения computed-свойства "isClearBtnShown"
 */
function setClearBtnState() {
  clearButton.style.display = isClearBtnShown() ? "flex" : "none";
}

/**
 * Создание кнопок пагинации в зависимости от количества объектов в data
 *
 * @param {array} data Массив пользователей
 * @param {number} usersOnPage Количество пользователей на одной странице
 */
function createPagination(data, usersOnPage = 5) {
  clearPagination();

  const countOfBtns = data.length / usersOnPage;
  [...Array(Math.ceil(countOfBtns)).keys()].forEach((btn, index) => {
    let paginationBtn = createNode("li");
    paginationBtn.innerHTML = `${index + 1}`;
    paginationBtn.setAttribute("id", `${index + 1}`);
    append(paginationBlock, paginationBtn);

    /**
     * Убираем активный класс у всех кнопок пагинации, кроме той, что удовлетворяет условию
     */
    function diactivatePaginationBtns() {
      paginationBlock.childNodes.forEach((el) => {
        el.classList.remove("current-pagination");
      });
    }

    if (selectPage === Number(paginationBtn.id)) {
      diactivatePaginationBtns();
      paginationBtn.classList.add("current-pagination");
    }

    paginationBtn.addEventListener("click", (e) => {
      selectPage = Number(e.target.id);
      updateTable();
    });
  });
}

/**
 * Обрезаем массив для отображения 5 users на странице
 */
function cutUsersByPage(data, usersOnPage = 5) {
  let start = (selectPage - 1) * usersOnPage;
  let end = start + usersOnPage;
  return data.slice(start, end);
}

/**
 * Убираем блок с пагинацией, если на странице нет пользователей
 */
function clearPagination() {
  paginationBlock.innerHTML = "";
}

/**
 * Открытие модального окна
 *
 * @param {id} id пользователя, который установили при создании таблицы
 */
function openModal(id) {
  selectedUserId = id;
  modal.classList.add("open");
}

/**
 * Находим индекc объекта по id и удаляем его из массива
 */
function removeObjectWithId(arr, id) {
  const objWithIdIndex = arr.findIndex((obj) => {
    return obj.id === id;
  });

  if (objWithIdIndex > -1) {
    arr.splice(objWithIdIndex, 1);
  }

  return arr;
}

/**
 * Создание таблицы с пользователями
 */
function createTableOfUsers(data) {
  clearTable();

  return cutUsersByPage(data).map(function (user) {
    let tr = createNode("tr");
    let name = createNode("td");
    let eMail = createNode("td");
    let registrationData = createNode("td");
    let rating = createNode("td");
    let buttonDelete = createNode("button");
    buttonDelete.setAttribute("id", `${user.id}`);
    name.innerHTML = `${user.username}`;
    eMail.innerHTML = `${user.email}`;
    registrationData.innerHTML = `${user.registration_date.toLocaleDateString()}`;
    rating.innerHTML = `${user.rating}`;
    buttonDelete.innerHTML = `<img class="close-icon" src = "./assets/icons/close-icon.svg">`;
    buttonDelete.classList.add("btn-close");
    buttonDelete.addEventListener("click", (e) => {
      openModal(e.target.id);
    });
    append(tr, name);
    append(tr, eMail);
    append(tr, registrationData);
    append(tr, rating);
    append(tr, buttonDelete);
    append(tbody, tr);
  });
}
/**
 * Очистка таблицы. Вспомогательная функция для обновления таблицы
 */
function clearTable() {
  tbody.innerHTML = "";
}

//
// Inits & Event Listeners
//

searchField.addEventListener("input", (e) => {
  searchUser(e.target.value);
  updateTable();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    diactivateSortFilters();
    filters[btn.id].isActive = true;
    filters[btn.id].isIncreases = !filters[btn.id].isIncreases;

    btn.classList.add("active-btn");
    updateTable();
  });
});

clearButton.addEventListener("click", (e) => {
  diactivateSortFilters();
  searchField.value = "";
  filteredUsers = [...users];
  updateTable();
});

btnCloseModal.addEventListener("click", (e) => {
  modal.classList.remove("open");
  selectedUserId = null;
});

deleteUserBtn.addEventListener("click", (e) => {
  modal.classList.remove("open");
  removeObjectWithId(users, selectedUserId);
  removeObjectWithId(filteredUsers, selectedUserId);
  updateTable();
});
