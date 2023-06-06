"use strict";

function createNode(element) {
  return document.createElement(element);
}

function append(parent, el) {
  return parent.appendChild(el);
}

const tbody = document.getElementById("tbody");
const clearButton = document.querySelector(".search__button");

// data
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

// computed
const activeFilters = () =>
  Object.values(filters).filter((item) => item.isActive);

const isClearBtnShown = () => activeFilters().length > 0 || !!search;

/** 
Get-запрос для получения списка пользователей, создание и заполнение ячеек таблицы.
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

const searchField = document.getElementById("search");
searchField.addEventListener("input", (e) => {
  searchUser(e.target.value);
  updateTable();
});

const filterBtns = document.querySelectorAll(".filter__btn");
filterBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    diactivateSortFilters();
    filters[btn.id].isActive = true;
    filters[btn.id].isIncreases = !filters[btn.id].isIncreases;

    btn.classList.add("active-btn");
    updateTable();
  });
});

function diactivateSortFilters() {
  Object.values(filters).forEach((filter) => {
    filter.isActive = false;
  });

  filterBtns.forEach((filterBtn) => {
    filterBtn.classList.remove("active-btn");
  });
}

function searchUser(value) {
  console.log(value, "value");
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

clearButton.addEventListener("click", (e) => {
  diactivateSortFilters();
  searchField.value = "";
  filteredUsers = [...users];
  updateTable();
});

function updateTable() {
  sortFilter(filteredUsers);
  setClearBtnState();
  createTableOfUsers(filteredUsers);
  createPagination(filteredUsers);
}

function setClearBtnState() {
  clearButton.style.display = isClearBtnShown() ? "flex" : "none";
}

/**
 * Пагинация
 */

const paginationBlock = document.querySelector(".pagination");

function createPagination(data, usersOnPage = 5) {
  clearPagination();

  const countOfBtns = data.length / usersOnPage;
  [...Array(Math.ceil(countOfBtns)).keys()].forEach((btn, index) => {
    let paginationBtn = createNode("li");
    paginationBtn.innerHTML = `${index + 1}`;
    paginationBtn.setAttribute("id", `${index + 1}`);
    append(paginationBlock, paginationBtn);

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

function clearPagination() {
  paginationBlock.innerHTML = "";
}

function cutUsersByPage(data, usersOnPage = 5) {
  let start = (selectPage - 1) * usersOnPage;
  let end = start + usersOnPage;
  return data.slice(start, end);
}

const modal = document.getElementById("modal");
function openModal(id) {
  selectedUserId = id;
  modal.classList.add("open");
}

function removeObjectWithId(arr, id) {
  const objWithIdIndex = arr.findIndex((obj) => {
    return obj.id === id;
  });

  if (objWithIdIndex > -1) {
    arr.splice(objWithIdIndex, 1);
  }

  return arr;
}

const btnCloseModal = document.getElementById("close-btn");
btnCloseModal.addEventListener("click", (e) => {
  modal.classList.remove("open");
  selectedUserId = null;
});

const deleteUserBtn = document.getElementById("delete-user");
deleteUserBtn.addEventListener("click", (e) => {
  modal.classList.remove("open");

  removeObjectWithId(users, selectedUserId);
  removeObjectWithId(filteredUsers, selectedUserId);

  updateTable();
});

/**
Helpers
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
    // tr.setAttribute("id", `${user.id}`);
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

function clearTable() {
  tbody.innerHTML = "";
}
