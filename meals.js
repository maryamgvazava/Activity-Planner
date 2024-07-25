const addMealPlan = document.querySelector('.addMealPlan');
const mealInput = document.querySelector('#mealInput');
const mealErrorMsg = document.querySelector('.mealErrorMsg');
const detailedMealPlan = document.querySelector('.detailedMealPlan');
const submitMeal = document.querySelector('#submitMeal');
const doneMeals = document.querySelector('.doneMeals');
const mealProgressbar = document.querySelector('.mealProgressbar');

let countAddMealPlan = 0;
let countDoneMealPlan = 0;

function updateMealProgressPercent() {
  const mealProgress = (countDoneMealPlan * 100) / countAddMealPlan;
  return Math.trunc(mealProgress);
}

function enableMealProgressBar() {
  const mealProgress = updateMealProgressPercent();
  mealProgressbar.setAttribute('mealRole', 'mealProgressbar');
  mealProgressbar.setAttribute('aria-mealvalue', mealProgress);
  mealProgressbar.setAttribute('aria-live', 'polite');
  if (isNaN(mealProgress)) {
    mealProgressbar.setAttribute('aria-mealvalue', 0);
  }
}

// საბმითის ღილაკზე კლიკის დროს
submitMeal.addEventListener('click', function (e) {
  submitMeal.style.display = 'none';
  e.preventDefault();
  let mealInputValue = mealInput.value;

  if (mealInputValue === '') {
    mealInput.style.outline = 'red';
    mealErrorMsg.style.display = 'block';
    submitMeal.style.display = 'block';
  } else {
    mealInput.style.outline = 'black';
    mealErrorMsg.style.display = 'none';
    let mealDiv = document.createElement('div');
    mealDiv.classList.add('mealDiv');
    mealDiv.innerHTML = `
      <h2 class="mealChapterTitle">${mealInputValue}</h2>
      <h2 class="addMeal">+</h2>
    `;

    detailedMealPlan.appendChild(mealDiv);

    let addMeal = mealDiv.querySelector('.addMeal');

    // Meal addition logic
    addMeal.addEventListener('click', function () {
      let meal = document.createElement('div');
      meal.classList.add('meal');

      meal.innerHTML = `
        <input type ="text" maxlength="10" class="mealType" placeholder="Enter Activity Name">
        <input type ="number" min="1" class="selectMealNumber" placeholder="Amount of reps">
        <input maxlength="10" class="mealQty" placeholder="Duration">
        <button class="btn btn-success submitMeal">Submit Activity</button>
      `;

      mealDiv.appendChild(meal);
      let submitMealButton = meal.querySelector('.submitMeal');
      submitMealButton.disabled = true;

      let mealType = meal.querySelector('.mealType');
      let selectMealNumber = meal.querySelector('.selectMealNumber');
      let mealQty = meal.querySelector('.mealQty');

      mealType.addEventListener('keyup', () => {
        enterFullActivity(mealType, mealErrorMsg);
        manageMealSubmitButton();
      });

      selectMealNumber.addEventListener('input', () => {
        enterFullActivity(selectMealNumber, mealErrorMsg);
        manageMealSubmitButton();
      });

      mealQty.addEventListener('keyup', () => {
        enterFullActivity(mealQty, mealErrorMsg);
        manageMealSubmitButton();
      });

      function enterFullActivity(input, err) {
        if (input.type === 'number') {
          if (input.value.trim() !== '' && !isNaN(input.value) && Number(input.value) > 0) {
            input.style.border = 'solid black 1px';
            err.style.display = 'none';
          } else {
            err.style.display = 'block';
            input.style.border = 'solid red 1px';
          }
        } else {
          if (input.value.trim().length > 3) {
            input.style.border = 'solid black 1px';
            err.style.display = 'none';
          } else {
            err.style.display = 'block';
            input.style.border = 'solid red 1px';
          }
        }
      }

      function manageMealSubmitButton() {
        if (
          mealType.value.trim().length > 3 &&
          selectMealNumber.value.trim() !== '' &&
          !isNaN(selectMealNumber.value) &&
          Number(selectMealNumber.value) > 0 &&
          mealQty.value.trim().length > 3
        ) {
          submitMealButton.disabled = false;
        } else {
          submitMealButton.disabled = true;
        }
      }

      submitMealButton.addEventListener('click', function (e) {
        e.preventDefault();

        countAddMealPlan++;
        enableMealProgressBar();

        let mealTypeValue = mealType.value;
        let selectMealNumberValue = selectMealNumber.value;
        let mealQtyValue = mealQty.value;

        meal.innerHTML = `
          <div class="actName">  
            <p4>${mealTypeValue}</p4>
          </div> 
          <div class="repsDiv" style="display:flex; flex-wrap:nowrap"> 
            <h4>${selectMealNumberValue} </h4>
            <h4>${mealQtyValue}</h4>
          </div>
          <input class="checkedMeal" type="checkbox" style="width:20px; height:20px">
        `;

        const checkedMeal = meal.querySelector('.checkedMeal');

        checkedMeal.addEventListener('change', function () {
          let parentMealDiv = this.closest('.mealDiv');
          let mealChapterTitle = parentMealDiv.querySelector('.mealChapterTitle').textContent;

          let doneMealSectionDiv = doneMeals.querySelector(`.doneMealSectionDiv[data-title="${mealChapterTitle}"]`);

          if (!doneMealSectionDiv) {
            doneMealSectionDiv = document.createElement('div');
            doneMealSectionDiv.classList.add('doneMealSectionDiv');
            doneMealSectionDiv.setAttribute('data-title', mealChapterTitle);

            let titleClone = document.createElement('h2');
            titleClone.textContent = mealChapterTitle;
            doneMealSectionDiv.appendChild(titleClone);

            doneMeals.appendChild(doneMealSectionDiv);
          }

          if (this.checked) {
            doneMealSectionDiv.appendChild(this.parentElement);
            countDoneMealPlan++;
            enableMealProgressBar();
          }

          if (!mealDiv.querySelector('div.meal')) {
            mealDiv.remove();
          }
        });
      });
    });
  }

  mealInput.value = '';
});

enableMealProgressBar();
