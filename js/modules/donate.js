var Donate = {
  init: function(){
    Donate.showDonate();
  },

  showDonate: function(){
    google.payments.inapp.getSkuDetails({
      parameters: {'env': 'prod'},
      success: Donate.onSkuDetails,
      failure: Donate.onSkuDetailsFail
    });
  },

  onSkuDetails: function(data){
    data.response.details.inAppProducts.sort(function(a, b){
      return a.prices[0].valueMicros - b.prices[0].valueMicros;
    });
    for(var i in data.response.details.inAppProducts){
      var product = data.response.details.inAppProducts[i];
      var localeData = product.localeData[0];
      var price = product.prices[0]
      var row = $('<tr><td>' + localeData.title + '</td><td>' + localeData.description +'</td><td>' + price.valueMicros / 1000000 + '</td><td><a href="#" class="btn btn-success donate-btn" data-sku="' + product.sku + '" data-track-click="' + product.sku + '">付款</a></td></tr>');
      row.find('[data-track-click]').click(Logger.onTrackClick);
      $('#donate_table > tbody').append(row);
    }
    Donate.bindDonateButtons();
    Donate.updatePurchases();
  },

  onSkuDetailsFail: function(data){
    console.error(data);
  },

  bindDonateButtons: function() {
    $('.donate-btn').click(function(e){
      google.payments.inapp.buy({
        parameters: {'env': 'prod'},
        sku: this.dataset.sku,
        success: Donate.onPurchase,
        failure: Donate.onPurchaseFail
      });
    });
  },

  onPurchase: function(data){
    Donate.logPurchase(data.response);
    $('#modal_thank_you').modal('show');
    Donate.updatePurchases();
  },

  onPurchaseFail: function(data){
    Donate.logPurchase(data.response);
  },

  updatePurchases: function(){
    google.payments.inapp.getPurchases({
      parameters: {'env': 'prod'},
      success: Donate.onLicenseUpdate,
      failure: Donate.onLicenseUpdateFail
    });
  },

  onLicenseUpdate: function(data){
    for(var i in data.response.details){
      var purchase = data.response.details[i];
      if(purchase.state == 'ACTIVE')
        $('[data-sku="' + purchase.sku + '"]')
          .removeClass('btn-success').addClass('btn-warning')
          .attr('disabled', 'disabled').text('已付');
    }
  },

  onLicenseUpdateFail: function(data){
    console.error(data);
  },

  logPurchase: function(response){
    chrome.identity.getProfileUserInfo(function(info){
      Logger.firebase.child('purchases').push({
        response: response,
        uid: info.id
      });
    });
  }
}