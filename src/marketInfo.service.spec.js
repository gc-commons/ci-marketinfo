'use strict';

describe('Service :: MarketInfo', function() {
  var service, http, $httpBackend;


  beforeEach(module('ci_marketInfo', function($provide) {
  }));

  beforeEach(inject(function(_httpSrv_, _$httpBackend_, _marketInfoSrv_) {
    http = _httpSrv_;
    service = _marketInfoSrv_;
    $httpBackend = _$httpBackend_;
  }));

  beforeEach(function() {
    $httpBackend.whenGET(/.*\/main\.html.*/).respond('<div></div>');
    $httpBackend.whenGET(/.*\/tradingapi\/UserAccount.*/).respond({});
    $httpBackend.whenGET('/dummyGET/true').respond({ get: true });
    $httpBackend.whenPOST('/dummyPOST/true').respond({ post: true });
    $httpBackend.whenGET(/.*\/config.*/)
      .respond(
      {
        "flexITP": {
          "tradingApiURL": "https://ciapiqat.cityindextest9.co.uk/tradingapi/"
        }
      });

    $httpBackend.whenPOST(/.*market\/information\/save.*/).respond(function(method, url, data, headers ){
      var requestBody = JSON.parse(data);
      expect(requestBody.hasOwnProperty('MarketInformation'));
      expect(requestBody.MarketInformation[0].hasOwnProperty('MarketInformation'));
      expect(requestBody.MarketInformation[0].hasOwnProperty('MarketId'));
      expect(requestBody.MarketInformation[0].hasOwnProperty('MarginFactor'));
      expect(requestBody.MarketInformation[0].hasOwnProperty('MarginFactorIsDirty'));
      expect(requestBody.MarketInformation[0].hasOwnProperty('PriceTolerance'));
      expect(requestBody.MarketInformation[0].hasOwnProperty('PriceToleranceIsDirty'));
      return {};
    });

    $httpBackend.whenPOST(/.*market\/information*/)
      .respond(function(method, url, data, headers) {
        var marketId = parseInt(JSON.parse(data).MarketIds[0]),
          marketinfo = MarketsInfoMock[marketId] || MarketsInfoMock.empty;
        return [(marketId == 0) ? 404 : 200, marketinfo, {}];
      });
  });

  it(':: GetInfo', function() {
    service.getInfo(400616115).then(function(data) {
      expect(data.hasOwnProperty('MarketId')).toBe(true);
    });
    $httpBackend.flush();
  });

  it(':: GetInfo Empty', function() {
    service.getInfo(303456).then(function(data) {
      expect(data.hasOwnProperty('MarketId')).toBe(false);
    })
    $httpBackend.flush();
  });

  it(':: GetInfo Fail', function() {
    service.getInfo(0).then(function(data) {
      expect(data.hasOwnProperty('MarketId')).toBe(false);
    }, function() {
    })
    $httpBackend.flush();
  });

  it(':: setInfo :: Success',function(){
    var requestBody;

    var obj = {};
    obj["MarketInformation"] = [];
    var marketInfoObject = {};
    marketInfoObject["MarketId"] = 99498;
    marketInfoObject["MarginFactor"] = 2;
    marketInfoObject["MarginFactorIsDirty"] = true;
    marketInfoObject["PriceTolerance"] = 5;
    marketInfoObject["PriceToleranceIsDirty"] = true;
    obj["MarketInformation"].push(marketInfoObject);
    obj["TradingAccountId"] = 'DM348630';

    service.setInfo(obj).then(function(){ });
    $httpBackend.flush();
  });

  it(':: addMarketId :: Success', function(){
    service.addMarketId(12345);
    expect(service.MarketIds[0]).toBe(12345);
  });

  it(':: getMarketIds :: Success', function(){
    service.addMarketId(12345);
    var mktIds = service.getMarketIds();
    expect(mktIds[0]).toBe(12345);
  });

});
