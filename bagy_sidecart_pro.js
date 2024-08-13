var sideCart = {};
sideCart.cartInfo = {isEmpty : true};
sideCart.lang = {
  header: "Meu Carrinho",
  back: "Continuar Comprando",
  next: "Finalizar Compra",
  empty: "Ops... seu carrinho está vazio!"
};
sideCart.findBestPaymentOptions = function(paymentOptions) {
  let bestCashOption = {markup:99999};
  let bestInstallmentOption = {parcels_no_interest : 0};
  //console.log(`aaa`,paymentOptions)
  paymentOptions.forEach(option => {
    //console.log(option)
      if ((option.method == "pix" || option.method == "billet") && option.markup < bestCashOption.markup) {
          bestCashOption = option
      }
      if (option.method == "creditcard" && option.parcels_no_interest > bestInstallmentOption.parcels_no_interest) {
        bestInstallmentOption = option
      }
  });
  let html = "";
  if(bestCashOption.installments.length > 0){
    // html+= `<div class="d-flex align-items-center">${bestCashOption.installments[0].discount > 0 ? `<small class="mr-2">(-${bestCashOption.installments[0].discount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})})</small>` : ''}${bestCashOption.installments[0].total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>`
    html+= `<div class="d-flex flex-column align-items-end justify-content-end mb-2">${bestCashOption.installments[0].total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} ${bestCashOption.installments[0].discount_percentage > 0 ? `<small class="d-block">à vista com ${Math.ceil(bestCashOption.installments[0].discount_percentage)}% OFF</small></div>` : ``}`
  }
  if(bestInstallmentOption.installments.length > 0){
    html+= `<div class="d-flex align-items-center justify-content-end"><small class="font-weight-bold">em até ${bestInstallmentOption.parcels_no_interest}x de ${bestInstallmentOption.installments[bestInstallmentOption.parcels_no_interest -1].parcel_price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</small></div>`
  }
  return html;
};
sideCart.run = function(){
  
  $('body').on('click','ajax-nav-cart a, .cart-redirect-checkout', function(e){
    e.preventDefault();
    $('body').toggleClass('sideCart-open');
  });
  $('body').on('click','#sideCart .sideCart-header button, #sideCart .sideCart-footer .sideCart-actions button', function(e){
    e.preventDefault();
    $('body').removeClass('sideCart-open');
  });
  $('body').on('click', '.sideCart-content .sideCart-item-delete', function(){
    let variation_id = $(this).attr('data-id');
    sideCart.cartInfo.items = sideCart.cartInfo.items.filter(el => el.variation_id != variation_id);

    sideCart.cartUpdate();
  });

  //change qtd
  $('body').on('click', '.sideCart-content .sideCart-item-quantity button', function(){
    let variation_id = $(this).closest('.sideCart-item-quantity').find('input').attr('data-id');
    let quantity = parseInt($(this).closest('.sideCart-item-quantity').find('input').val());
    let updateItem = sideCart.cartInfo.items.find(el => el.variation_id == variation_id)
    
    if($(this).hasClass('sideCart-item-add')){
      quantity = parseInt(quantity) + 1;
    }else{
      quantity = parseInt(quantity) - 1;
    }
    if(updateItem){
      updateItem.quantity = quantity;
      sideCart.cartUpdate();
    }
    
  });
  
  //gift wrap
  $('body').on('change', '.sideCart-content [name="gift_wrapping_accept"]', function(){
    let variation_id = $(this).attr('data-id');
    let status = $(this).is(':checked');
    let updateItem = sideCart.cartInfo.items.find(el => el.variation_id == variation_id)
    if(updateItem){
      updateItem.has_gift_wrapping = status
      sideCart.cartUpdate();
    }
  });
  sideCart.buildTemplate();
  sideCart.getCart();
  
  $(document).ajaxComplete(function(event, xhr, settings) {
    if (settings.url && settings.url.includes('/add')) {
      sideCart.getCart();
      $('body').addClass('sideCart-open');
    }
});
  
};
sideCart.buildTemplate = function(){
  if($(`#sideCart`).length == 0){
    $('body').append(`<div id=sideCart><div class="loading"><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div><div class=sideCart-header><span>${sideCart.lang.header}</span><button type="button"><i class="h-sc-color material-icons md-36">close</i></button></div><div class=sideCart-content></div><div class=sideCart-footer><hr><div class=sideCart-values></div><div class=sideCart-actions><a class=btn-checkout href=/carrinho>${sideCart.lang.next}</a> <button class=btn-back type=button>${sideCart.lang.back}</button></div></div></div>`);  
  }
  $(`#sideCart`).html(`<div class="loading"><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div><div class=sideCart-header><span>${sideCart.lang.header}</span><button type="button"><i class="h-sc-color material-icons md-36">close</i></button></div><div class=sideCart-content></div><div class=sideCart-footer><hr><div class=sideCart-values></div><div class=sideCart-actions><a class=btn-checkout href=/carrinho>${sideCart.lang.next}</a> <button class=btn-back type=button>${sideCart.lang.back}</button></div></div>`);
  
};

sideCart.updateFooterActions = function(){
  $(`#sideCart .sideCart-footer .sideCart-actions`).html(`${sideCart.showErrors(sideCart.cartInfo, 'subtotal').length > 0 ? sideCart.showErrors(sideCart.cartInfo, `subtotal`) : `<a class=btn-checkout href=/carrinho>${sideCart.lang.next}</a>`} <button class=btn-back type=button>${sideCart.lang.back}</button>`);
  
};

sideCart.itemPrice = function(i){
  let price = i.price;
  // if(i.has_gift_wrapping){
  //   price = price + (i.gift_wrapping_price * i.quantity)
  // }  
  price = price * i.quantity
  return price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}
sideCart.itemSalePrice = function(i){
  let price = i.price;
  
  //console.log(price)
  if(i.discount){
    price = price - i.discount
  }

  price = price * i.quantity
  // if(i.has_gift_wrapping){
  //   price = price + (i.gift_wrapping_price * i.quantity)
  // }
  return price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}
sideCart.showErrors = function(i, type){
  let text = '';
  if(type != "subtotal"){
    $.each(i.errors, function(k,i){
      text += (text != "" ? '<br>' : '') + i;
    });
  }
  if(type == "subtotal" && sideCart.cartInfo){  
    $.each(sideCart.cartInfo.errors, function(k,i){
      text += (text != "" ? '<br>' : '') + i;
    });  
    //console.log(text.length, sideCart.cartInfo)
    if(text.length == 0 && sideCart.cartInfo.items){
      let hasErr = sideCart.cartInfo.items.filter(el => el.errors);
      //console.log(`xxx`,hasErr)
      if(hasErr.length > 0){
        text += (text != "" ? '<br>' : '') + 'Revise seu carrinho! Alguma regra está impedindo a finalização da compra.';
      }
    }
    //console.log(`aa`, text.length)
  }

  if(text != ""){
    return `<div class="alert-danger mt-3 ${type != "subtotal" ? 'mx-3' : ''}">${text}</div>`
  }
  return ''
}
sideCart.showGroupList = function(i){
  let text = '';
  $.each(i.components, function(k,i){
    text += '<p>' + i.quantity + 'x ' + i.name + '</p>';
  });

  if(text != ""){
    return `<div class="group-list mb-3">${text}</div>`
  }
  return '<span></span>'
}
sideCart.subtotalPrices = function(i){
  let text = '';
  $.each(i.components, function(k,i){
    text += '<p>' + i.quantity + 'x ' + i.name + '</p>';
  });

  if(text != ""){
    return `<div class="group-list mb-3">${text}</div>`
  }
  return '<span></span>'
}
sideCart.placeContent = function(){
  $('#sideCart .sideCart-content').empty();
  if(sideCart.cartInfo.isEmpty){
    $(`<p class="empty">${sideCart.lang.empty}</p>`).appendTo('#sideCart .sideCart-content');
    $('#sideCart .sideCart-values, #sideCart .sideCart-actions').empty();
  }else{
     $.each(sideCart.cartInfo.items, function(k,i){
      $(`<div class="row sideCart-item ml-0"><div class="col-3"><img class="img-responsive w-100" src=${i.image}></div><div class="col-9 title"><div class=row><div class="col name">${i.name}</div><div class=col-auto><button class=sideCart-item-delete type=button data-id=${i.variation_id}><i class="h-sc-color material-icons md-36">delete</i></button></div></div>${i.variation ? ' <small class="d-block mt-3">'+i.variation+'</small>':''}<br>${i.discount>0 ? ' <span class="d-flex align-items-center font-weight-bold mb-2 text" style=--tx-fs:10px;color:var(--success)><i class="h-sc-color material-icons md-36 mr-1" style="font-size:var(--tx-fs)">check</i> Você ganhou '+i.discount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+' de desconto </span>':''}${sideCart.showGroupList(i)}<div class="row align-items-center"><div class=col><div class="d-flex sideCart-item-quantity"><button class=sideCart-item-remove type=button><i class="h-sc-color material-icons md-36">remove</i></button><input data-id=${i.variation_id} name=customCartQuantity type=number value=${i.quantity}><button class=sideCart-item-add type=button><i class="h-sc-color material-icons md-36">add</i></button></div></div><div class=col-auto><div class="align-items-center d-flex flex-column">${i.subtotal>i.total ? ' <s><small>'+ sideCart.itemPrice(i) +'</small></s>':''}<strong>${sideCart.itemSalePrice(i) }</strong></div></div></div></div></div>${i.gift_wrapping_accept ? `<small class="d-flex mx-3 align-items-center mt-3"><input type="checkbox" value="true" ${i.gift_wrapping_accept && i.has_gift_wrapping ? 'checked':''} data-id="${i.variation_id}" class="mr-1" name="gift_wrapping_accept"/>Embalar para presente (+ ${(i.gift_wrapping_price * i.quantity).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})</small>` : `` }<small class="d-flex align-items-center">${sideCart.showErrors(i)}</small><hr class=my-4>`).appendTo('#sideCart .sideCart-content');
    });
    $('#sideCart .sideCart-values').empty();
    
    $(`<div class='row justify-content-between'><div class="col"><span>Subtotal</span></div><div class="text-right col"><small>${sideCart.cartInfo.subtotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</small><strong>${sideCart.findBestPaymentOptions(sideCart.cartInfo.payments)}<div></div></strong></div>`).appendTo('#sideCart .sideCart-values');
    sideCart.updateFooterActions();
  }
  
  sideCart.updateFooterActions();
  $('body').removeClass('updatingSideCart');
};
// sideCart.setMinMaxQuantity = function(item, quantity){
//   var productId = item.product_id;
//   item.quantity = quantity;
//   // if (productMinQuantity) {
//   //     productMinQuantity = parseInt(productMinQuantity);
//   //     if (productMinQuantity !== 1) {
//   //         if(item.balance > productMinQuantity){
//   //               if(item.quantity < productMinQuantity){
//   //                   item.quantity = productMinQuantity;
//   //                   flag=true;
//   //                 //console.log('set min');
//   //               }else{
//   //                   var division = item.quantity/productMinQuantity;
//   //                   var decimal = division % 1;
//   //                   if(decimal > .5){
//   //                     //console.log('decimal up');
//   //                       division = Math.floor(division);
//   //                       flag = true
//   //                   }if(decimal > 0 && decimal < .5){
//   //                     //console.log('decimal down');
//   //                       division = Math.ceil(division);
//   //                       flag = true
//   //                   }
//   //                   item.quantity = division * productMinQuantity;
//   //               }
//   //         }
//   //     }
//   // }
//   return item
// }
sideCart.cartUpdate = function(){ 
  $('body').addClass('updatingSideCart');
    var cookie = new _dcs.Cookies();
    var url  = window.shop_ctx.api_checkout_url + '/carts/' + cookie.get('_dc_cart');

    $.ajax({
        url: url,
        headers: {
            'shopid': window.dooca.shop_id,
            'Access-Control-Allow-Origin': '*',
            'Content-Type':'application/json'
        },
      contentType : 'application/json',
        method: "PUT",
        cache: false,
      data: JSON.stringify({items:sideCart.cartInfo.items})
      }).done(function (data){
        if(data.items.length > 0){
          sideCart.cartInfo = data;
        }else{
          sideCart.cartInfo = {isEmpty : true};
        }
        sideCart.placeContent();
    }).fail(function(){
      sideCart.cartInfo = {isEmpty : true};
    });

};
sideCart.getCart = function(){
  $('body').addClass('updatingSideCart');
  var cookie = new _dcs.Cookies();
  if (cookie.get('_dc_cart')){
    var url  = window.shop_ctx.api_checkout_url + '/carts/' + cookie.get('_dc_cart') + '';

    $.ajax({
        url: url,
        headers: {
            'shopid': window.dooca.shop_id,
            'Access-Control-Allow-Origin': '*',
            'Content-Type':'application/json'
        },
        method: "GET",
        cache: false,
    }).done(function (data){
        window.currentCart = data;
        if(data.items.length > 0){
          sideCart.cartInfo = data;
        }else{
          sideCart.cartInfo = {isEmpty : true};
        }
        sideCart.placeContent();
    }).fail(function(){
      sideCart.cartInfo = {isEmpty : true};
    });
  }else{
    sideCart.cartInfo = {isEmpty : true};
    sideCart.placeContent();
  }
};

document.addEventListener("DOMContentLoaded", function() {
  sideCart.run();
});

