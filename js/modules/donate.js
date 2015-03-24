var Donate = {
  settings: {
    medals: {
      bronze: '青銅', silver: '白銀',
      gold: '黃金', platinum: '白金'
    }
  },

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
      var price = product.prices[0];
      var row = $('<tr><td>' + localeData.title + '</td><td>' + localeData.description +'</td><td>' + price.valueMicros / 1000000 + '</td><td><a href="#" class="btn btn-success donate-btn" data-sku="' + product.sku + '" data-track-click="' + product.sku + '">我要贊助</a></td></tr>');
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
    var isDonated = false;
    for(var i in data.response.details){
      var purchase = data.response.details[i];
      if(purchase.state == 'ACTIVE' && purchase.sku.lastIndexOf("donate_", 0) === 0 /* startWith */){
        isDonated = true;
        var medal = purchase.sku.match(/^donate_(.*)$/)[1];
        Donate.updateDonateText(medal);
        Donate.showRibbon(medal);
        $('#donate_close_btn').text('關閉');
        break;
      }
    }
    if(!isDonated){
      $('#nav_donate').show();
      if(Search.isValidQuery()) $('#top_donate_text').show();
    }
  },

  onLicenseUpdateFail: function(data){
    console.error(data);
  },

  logPurchase: function(response){
    Logger.log('purchases', {response: response});
  },

  updateDonateText: function(medal) {
    $('#donate_table').hide();
    document.getElementById('donate_text').innerHTML = '<h4 class="media-heading">謝謝你！</h4><p>你買了' + Donate.settings.medals[medal] + '級贊助，非常感謝你的支持！</p>';
    document.getElementById('donate_avatar').src = '/img/avatar_smile.png';
  },

  showRibbon: function(medal){
    var starClasses = Donate.medalStarClasses(medal);
    var s = '<a href="#">';
    for(var i in starClasses)
      s += '<span class="glyphicon ' + starClasses[i] + '"></span> ';
    s += Donate.settings.medals[medal] + '贊助';
    starClasses.reverse();
    for(var i in starClasses)
      s += ' <span class="glyphicon ' + starClasses[i] + '"></span>';
    s += '</a>';
    $('#ribbon').html(s);
  },

  medalStarClasses: function(medal){
    switch(medal){
      case 'bronze': return ['glyphicon-star-empty'];
      case 'silver': return ['glyphicon-star'];
      case 'gold': return ['glyphicon-star-empty', 'glyphicon-star'];
      case 'platinum': return ['glyphicon-star', 'glyphicon-star'];
      default: return "";
    }
  }
}