const activityInput = document.querySelector('#activityInput');
const submit = document.querySelector('#submit');
const detailedActs = document.querySelector('.detailedActs');
const errorMsg = document.querySelector('.errorMsg')
const progressbar = document.querySelector('.progressbar');




let countAddedActivities = 0;
let countDoneActivities = 0;






function updateProgressPercent() {
const progress = (countDoneActivities * 100) / countAddedActivities;
  return Math.trunc(progress)
}
function enableProgressBar() {
  const progress = updateProgressPercent();
  progressbar.setAttribute('role', 'progressbar');
  progressbar.setAttribute('aria-valuenow', progress);
  progressbar.setAttribute('aria-live', 'polite');
  if (isNaN(progress)){
    progressbar.setAttribute('aria-valuenow', 0);
  }
}



//საბმითის ღილაკზე კლიკის დროს
submit.addEventListener('click', function(e) {
  submit.style.display = 'none';
  e.preventDefault();
  let activityType = activityInput.value;

    if(activityType == ''){
      activityInput.style.outline = 'red';
      errorMsg.style.display = 'block';
      submit.style.display = 'block';
    } else {

      activityInput.style.outline = 'black';
      errorMsg.style.display = 'none';
      let activityDiv = document.createElement('div');
      activityDiv.classList.add('activityDiv');
      activityDiv.innerHTML = `
        <h2 class="activityChapterTitle">${activityType}</h2>
        <h2 class="addActivity">+</h2>
        <h2 class="deleteActivity">-</h2>
      `;

        detailedActs.appendChild(activityDiv);

      let addActivity = activityDiv.querySelector('.addActivity');
      let deleteActivity = activityDiv.querySelector('.deleteActivity');



        //სავარჯიშოს დაამტების დროს; + ღილაკი
          addActivity.addEventListener('click', function() {
            // addActivity.disabled = true;
            // deleteActivity.disabled = true;
            
            let activity = document.createElement('div');
            activity.classList.add('activities');
          
            activity.innerHTML = `
              <input type ="text" maxlength="10" class="subActivity" placeholder="Enter Activity Name">
                <input type ="number" min="1" class="selectRepeatnumber" placeholder="amount of reps">
              <input maxlength="10"  class="qty" placeholder="duration">
              <button class="btn btn-success submitActivity">submit Activity</button>
            `;

            activityDiv.appendChild(activity);
            let submitActivityButton = activity.querySelector('.submitActivity');
            submitActivityButton.disabled = true

                   // სავარჯიშოს დეტალების შეყვანის დროს
              
            
                    let subActivityInput = activity.querySelector('.subActivity');
                    let selectRepeatnumberInput = activity.querySelector('.selectRepeatnumber');
                    let qtyInput = activity.querySelector('.qty');



                                subActivityInput.addEventListener('keyup', () => {enterFullActivity(subActivityInput ); manageSubmitButton()})
                                selectRepeatnumberInput.addEventListener('input',() => {enterFullActivity(selectRepeatnumberInput ); manageSubmitButton()})
                                qtyInput.addEventListener('keyup',() => {enterFullActivity(qtyInput ); manageSubmitButton()})
                                          function enterFullActivity(input){
                                            if (input.type === 'number') {
                                              if (input.value.trim() !== '' && !isNaN(input.value) && Number(input.value) > 0) {
                                                input.style.border = 'solid black 1px';
                                                errorMsg.style.display = 'none';
                                              } else {
                                                errorMsg.style.display = 'block';
                                                input.style.border = 'solid red 1px';
                                              }
                                            } else {
                                              if (input.value.trim().length > 3) {
                                                input.style.border = 'solid black 1px';
                                                errorMsg.style.display = 'none';
                                              } else {
                                                errorMsg.style.display = 'block';
                                                input.style.border = 'solid red 1px';
                                              }
                                            }
                                          }
                                          function manageSubmitButton() {
              if(subActivityInput.value.trim().length > 3 && selectRepeatnumberInput.value.trim() !== '' && !isNaN(selectRepeatnumberInput.value) && Number(selectRepeatnumberInput.value) > 0 && qtyInput.value.trim().length > 3 ) {
                                    submitActivityButton.disabled = false
                                  } else {
                                    submitActivityButton.disabled = true
                                  }

                                }

                                submitActivityButton.addEventListener('click', function(e) {
                                  e.preventDefault();
            
                      countAddedActivities++;
                      enableProgressBar();
            
                      let subActivity = subActivityInput.value;
                      let selectRepeatnumber = selectRepeatnumberInput.value;
                      let qty = qtyInput.value;
            
                      activity.innerHTML = `
                        <div class="actName">  
                          <p4>${subActivity}</p4>
                        </div> 
                        <div class="repsDiv" style="display:flex; flex-wrap:nowrap"> 
                          <h4>${selectRepeatnumber} </h4>
                          <h4>${qty}</h4>
                        </div>
                        <input class="checked" type="checkbox" style="width:20px; height:20px">
                      `;
                             

                      //სავარჯიშოს შესრულებულად მონიშვნა
                      const doneActivities = document.querySelector('.doneActivities');


                      const checkedInput = document.querySelectorAll('.checked');


                         
                            checkedInput.forEach(function(box) {
                        
                              box.addEventListener('change', function() {
                                
                                let parentActivityDiv = box.closest('.activityDiv');
                                let activityChapterTitle = parentActivityDiv.querySelector('.activityChapterTitle').textContent;

                                let doneSectionDiv = doneActivities.querySelector(`.doneSectionDiv[data-title="${activityChapterTitle}"]`);
                                // console.log(doneSectionDiv)

                                //data ატრიბუტის დამატება სათაურის გამეორების თავიდან ასაცილებლად.
                                //თუ შევქმნი ორ ერთნაირი სათაურის მქონე სექციას, ქვე-კატეგორიები დაექვემდებარება მხოლოდ ერთს

                                if (!doneSectionDiv) {
                                  // console.log(doneSectionDiv)
                                  doneSectionDiv = document.createElement('div');
                                  doneSectionDiv.classList.add('doneSectionDiv');
                                  doneSectionDiv.setAttribute('data-title', activityChapterTitle);

                                  let titleClone = document.createElement('h2');
                                  titleClone.textContent = activityChapterTitle;
                                  doneSectionDiv.appendChild(titleClone);

                                  doneActivities.appendChild(doneSectionDiv);
                                }

                                if (this.checked) {
                                  doneSectionDiv.appendChild(this.parentElement);
                                 
                                  countDoneActivities++;

                                  enableProgressBar()
                                }

                                  //თუ ყველა მოვნიშნე და მხოლოდ სექციის სათაური დამრჩა, სათაური წაიშლება
                                if (!activityDiv.querySelector('div.activities')) {
                                  activityDiv.remove()
                                }

                              });

                      });

                    });
          })
    }
  activityInput.value = '';
});


enableProgressBar();








