var emailForm = $('#frmEmail');
var btnEmail = $('#btnEmail');
var emailLabel = $('#emailLabel');
var emailUrl = templateUrl + '/library/api/email.php';

// console.log(emailUrl);

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}


btnEmail.click(function() {
  var emailInput = $('#txtInput').val();

  $('#emailLabel span').remove();
  var isValid = validateEmail(emailInput);
  if (isValid) {

    $.post(emailUrl, emailForm.serialize(), function(data) {

      var jData = JSON.parse(data);
      console.log(jData);
      if (jData.success == false) {
        emailLabel.addClass('red');
        emailLabel.prepend('<span>* ' + jData.message + '</span>');
      } else {
        btnEmail.text(jData.message);
      }

      txtInput.value = '';
    });
  } else {
    emailLabel.addClass('red');
    emailLabel.prepend('<span>* Invalid email</span>');
  }

});

$('#emailDataTable').dataTable({
  "processing": true,
  "ajax": templateUrl + "/library/api/emails.json",
  "columns": [{
      "data": "select"
    },

    {
      "data": "email"
    },
    {
      "data": "date"
    },
    {
      "data": "id"
    }
  ],
  "columnDefs": [{
      "aTargets": [0],
      "mData": "select",
      "mRender": function(data, type, full) {

        return '<input type="checkbox" data-id="' + full.id + '"/>';
      }
    },
    {
      "aTargets": [3],
      "mData": "id",
      "mRender": function(data, type, full) {

        return '<button type="button" class="dtDeleteEmail" data-id="' + full.id + '">delete</button>';
      }
    }
  ]

  // "aoColumns": [{
  //   "mData": 'test'
  // }],
  // "aoColumnDefs": [{
  //   "aTargets": [4],
  //   "mData": "test",
  //   "mRender": function(data, type, full) {
  //
  //     return '<button type="button" data-id="' + full.id + '">options</button>';
  //   }
  // }]



});