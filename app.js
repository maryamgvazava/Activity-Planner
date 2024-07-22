const activityInput = document.querySelector('#activityInput');
const submit = document.querySelector('#submit');
const detailedActs = document.querySelector('.detailedActs');
const errorMsg = document.querySelector('.errorMsg')
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

  addActivity.addEventListener('click', function() {
    addActivity.disabled = true;
    deleteActivity.disabled = true;

    let activity = document.createElement('div');
    activity.classList.add('activities');
   
    activity.innerHTML = `
      <input class="subActivity" placeholder="Enter Activity Name">
      <select class="selectRepeatnumber">
        <option value="" selected disabled>amount of reps</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="130">130</option>
        <option value="104">104</option>
      </select>
      <select class="qty">
        <option value="" selected disabled>duration of reps</option>
        <option value="min">min</option>
        <option value="qty">reps</option>
      </select>
      <button class="btn btn-success submitActivity">submit Activity</button>
    `;

    activityDiv.appendChild(activity);


   




    let submitActivityButton = activity.querySelector('.submitActivity');

    submitActivityButton.addEventListener('click', function(e) {
      e.preventDefault();
      submit.style.display = 'block';
      submitActivityButton.disabled = false;
      let subActivity = activity.querySelector('.subActivity').value;
      let selectRepeatnumber = activity.querySelector('.selectRepeatnumber').value;
      let qty = activity.querySelector('.qty').value;

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

      activity.style.flexWrap = "nowrap";

      const doneActivities = document.querySelector('.doneActivities');
      const checkedInput = document.querySelectorAll('.checked');

      checkedInput.forEach(function(box) {
        box.addEventListener('change', function() {
          let parentActivityDiv = box.closest('.activityDiv');
          let activityChapterTitle = parentActivityDiv.querySelector('.activityChapterTitle').textContent;

          let doneSectionDiv = doneActivities.querySelector(`.doneSectionDiv[data-title="${activityChapterTitle}"]`);
          console.log(doneSectionDiv)

          if (!doneSectionDiv) {
            console.log(doneSectionDiv)
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
          }



          if (!activityDiv.querySelector('div.activities')) {
            activityDiv.remove()
          }

        });

      });

    });

  


    
  })
//   const activities = document.querySelector('.activities')
//   document.addEventListener('click', function(event){
//     if(event.target.classList.contains('activities') || event.target.classList.contains('actName')){
//       activities.classList.toggle('selectForDeletion')
//     }

// });


  deleteActivity.addEventListener('click', function() {
    detailedActs.removeChild(activityDiv);
    submit.style.display = 'block';
  });
}
  activityInput.value = '';
});
