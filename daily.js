const addDailyPlan = document.querySelector('.addDailyPlan');
const dailyPlanInput = document.querySelector('#dailyPlanInput');
const dailyPlanErrorMsg = document.querySelector('.dailyPlanErrorMsg');
const detailedDailyPlan = document.querySelector('.detailedDailyPlan');
const submitDailyPlan = document.querySelector('#submitDailyPlan');
const doneDailyPlans = document.querySelector('.doneDailyPlans');
const dailyPlanProgressbar = document.querySelector('.dailyPlanProgressbar');

let countAddDailyPlan = 0;
let countDoneDailyPlan = 0;

function updateDailyPlanProgressPercent() {
  const dailyPlanProgress = (countDoneDailyPlan * 100) / countAddDailyPlan;
  return Math.trunc(dailyPlanProgress);
}

function enableDailyPlanProgressBar() {
  const dailyPlanProgress = updateDailyPlanProgressPercent();
  dailyPlanProgressbar.setAttribute('dailyPlanRole', 'dailyPlanProgressbar');
  dailyPlanProgressbar.setAttribute('aria-dailyPlanValue', dailyPlanProgress);
  dailyPlanProgressbar.setAttribute('aria-live', 'polite');
  if (isNaN(dailyPlanProgress)) {
    dailyPlanProgressbar.setAttribute('aria-dailyPlanValue', 0);
  }
}

// საბმითის ღილაკზე კლიკის დროს
submitDailyPlan.addEventListener('click', function (e) {
  submitDailyPlan.style.display = 'none';
  e.preventDefault();
  let dailyPlanInputValue = dailyPlanInput.value;

  if (dailyPlanInputValue === '') {
    dailyPlanInput.style.outline = 'red';
    dailyPlanErrorMsg.style.display = 'block';
    submitDailyPlan.style.display = 'block';
  } else {
    dailyPlanInput.style.outline = 'black';
    dailyPlanErrorMsg.style.display = 'none';
    let dailyPlanDiv = document.createElement('div');
    dailyPlanDiv.classList.add('dailyPlanDiv');
    dailyPlanDiv.innerHTML = `
      <h2 class="dailyPlanChapterTitle">${dailyPlanInputValue}</h2>
      <h2 class="addDailyPlanItem">+</h2>
    `;

    detailedDailyPlan.appendChild(dailyPlanDiv);

    let addDailyPlanItem = dailyPlanDiv.querySelector('.addDailyPlanItem');

    // Daily plan item addition logic
    addDailyPlanItem.addEventListener('click', function () {
      let dailyPlanItem = document.createElement('div');
      dailyPlanItem.classList.add('dailyPlanItem');

      dailyPlanItem.innerHTML = `
        <input type="text" maxlength="10" class="dailyPlanType" placeholder="Enter Activity Name">
        <input type="number" min="1" class="selectDailyPlanNumber" placeholder="Amount of reps">
        <input maxlength="10" class="dailyPlanQty" placeholder="Duration">
        <button class="btn btn-success submitDailyPlanItem">Submit Activity</button>
      `;

      dailyPlanDiv.appendChild(dailyPlanItem);
      let submitDailyPlanItemButton = dailyPlanItem.querySelector('.submitDailyPlanItem');
      submitDailyPlanItemButton.disabled = true;

      let dailyPlanType = dailyPlanItem.querySelector('.dailyPlanType');
      let selectDailyPlanNumber = dailyPlanItem.querySelector('.selectDailyPlanNumber');
      let dailyPlanQty = dailyPlanItem.querySelector('.dailyPlanQty');

      dailyPlanType.addEventListener('keyup', () => {
        enterFullActivity(dailyPlanType, dailyPlanErrorMsg);
        manageDailyPlanSubmitButton();
      });

      selectDailyPlanNumber.addEventListener('input', () => {
        enterFullActivity(selectDailyPlanNumber, dailyPlanErrorMsg);
        manageDailyPlanSubmitButton();
      });

      dailyPlanQty.addEventListener('keyup', () => {
        enterFullActivity(dailyPlanQty, dailyPlanErrorMsg);
        manageDailyPlanSubmitButton();
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

      function manageDailyPlanSubmitButton() {
        if (
          dailyPlanType.value.trim().length > 3 &&
          selectDailyPlanNumber.value.trim() !== '' &&
          !isNaN(selectDailyPlanNumber.value) &&
          Number(selectDailyPlanNumber.value) > 0 &&
          dailyPlanQty.value.trim().length > 3
        ) {
          submitDailyPlanItemButton.disabled = false;
        } else {
          submitDailyPlanItemButton.disabled = true;
        }
      }

      submitDailyPlanItemButton.addEventListener('click', function (e) {
        e.preventDefault();

        countAddDailyPlan++;
        enableDailyPlanProgressBar();

        let dailyPlanTypeValue = dailyPlanType.value;
        let selectDailyPlanNumberValue = selectDailyPlanNumber.value;
        let dailyPlanQtyValue = dailyPlanQty.value;

        dailyPlanItem.innerHTML = `
          <div class="actName">  
            <p4>${dailyPlanTypeValue}</p4>
          </div> 
          <div class="repsDiv" style="display:flex; flex-wrap:nowrap"> 
            <h4>${selectDailyPlanNumberValue}</h4>
            <h4>${dailyPlanQtyValue}</h4>
          </div>
          <input class="checkedDailyPlan" type="checkbox" style="width:20px; height:20px">
        `;

        const checkedDailyPlan = dailyPlanItem.querySelector('.checkedDailyPlan');

        checkedDailyPlan.addEventListener('change', function () {
          let parentDailyPlanDiv = this.closest('.dailyPlanDiv');
          let dailyPlanChapterTitle = parentDailyPlanDiv.querySelector('.dailyPlanChapterTitle').textContent;

          let doneDailyPlanSectionDiv = doneDailyPlans.querySelector(`.doneDailyPlanSectionDiv[data-title="${dailyPlanChapterTitle}"]`);

          if (!doneDailyPlanSectionDiv) {
            doneDailyPlanSectionDiv = document.createElement('div');
            doneDailyPlanSectionDiv.classList.add('doneDailyPlanSectionDiv');
            doneDailyPlanSectionDiv.setAttribute('data-title', dailyPlanChapterTitle);

            let titleClone = document.createElement('h2');
            titleClone.textContent = dailyPlanChapterTitle;
            doneDailyPlanSectionDiv.appendChild(titleClone);

            doneDailyPlans.appendChild(doneDailyPlanSectionDiv);
          }

          if (this.checked) {
            doneDailyPlanSectionDiv.appendChild(this.parentElement);
            countDoneDailyPlan++;
            enableDailyPlanProgressBar();
          }

          if (!dailyPlanDiv.querySelector('div.dailyPlanItem')) {
            dailyPlanDiv.remove();
          }
        });
      });
    });
  }

  dailyPlanInput.value = '';
});

enableDailyPlanProgressBar();

