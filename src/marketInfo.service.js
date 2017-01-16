(function() {
  'use strict';

  /**
   * {Factory} UserSrv
   * @fileOverview User info handler
   */
  angular
    .module('ci_marketInfo', ['ci_call2api', 'ci_translate'])
    .factory('marketInfoSrv', [
      '$q', '$rootScope', 'call2ApiSrv', 'translateSrv',
      function($q, $rootScope, call2ApiSrv, translateSrv) {

        var self = {
            MarketIds: [],
            MarketInfo: []
          },
          lifeSpan = 10 * 60 * 1000, // 30 minutes expressed as milliseconds
          queue = [],
          isSearching = [];


        function checkLifeSpan() {
          var marketInfo_Cache = translateSrv._('marketInfo_Cache');

          if (_.isNumber(marketInfo_Cache)) {
            lifeSpan = marketInfo_Cache * 60 * 1000;
          }
        }

        checkLifeSpan();


        /**
         * @name getInfo function
         * @description Call retrieves market info.
         * @return {promise}
         */
        self.getInfo = function(marketId, _forceReload) {
          var deferred = $q.defer(),
            marketIds,
            retVal;
          if (marketId) {
            marketIds = (typeof marketId != "object") ? [marketId] : marketId;
          } else {
            marketIds = self.MarketIds;
          }
          var newMarkets = newMarket(marketIds),
            expiredMarkets = expiredInfo(marketIds),
            requestMarkets = _.union(newMarkets, expiredMarkets);
          if (newMarkets.length > 0 || _forceReload || expiredMarkets.lentgth > 0) {//market is not cached or need to refresh it
            if (isSearching[marketIds[0]]) {
              queue[marketIds[0]].push(function(data) {
                deferred.resolve(data);
              });
            } else {
              isSearching[marketIds[0]] = true;
              queue[marketIds[0]] = [];
              call2ApiSrv.makePostSignCall('market/information', {}, {
                MarketIds: requestMarkets
              }).then(function(data) {
                angular.forEach(data.MarketInformation, function(market) {
                  _.remove(self.MarketInfo, function(marketObj) {
                    return marketObj.MarketId == marketIds[0];
                  });
                  var timeStamp = new Date();
                  market.timeStamp = timeStamp.getTime();
                  self.MarketInfo.push(market);
                });

                retVal = _.find(self.MarketInfo, function(market) {
                  return (marketIds.indexOf(market.MarketId) > -1);
                });
                angular.forEach(queue[marketIds[0]], function(val) {
                  val(retVal);
                });
                deferred.resolve(retVal);
                queue[marketIds[0]] = [];
                isSearching[marketIds[0]] = false;
              }, function(error) {
                deferred.reject(error);
              });
            }

          } else { //market is cached
            retVal = _.find(self.MarketInfo, function(market) {
              return (marketIds.indexOf(market.MarketId) > -1);
            });
            deferred.resolve(retVal);
          }
          return deferred.promise;
        };


        /**
         * @name expiredInfo function
         * @description Checks if the Market Info for the given MarketId expired
         * @param {Array} Array of Market Ids
         * @return {Array}
         */
        function expiredInfo(marketIds) {
          var expiredMarkets = [],
            currentTime = new Date();

          checkLifeSpan();
          
          angular.forEach(marketIds, function(marketId) {
            var market = _.find(self.MarketInfo, function(market) {
              return market.MarketId == marketId;
            });
            if(market && currentTime.getTime() - market.timeStamp >= lifeSpan) {
              expiredMarkets.push(marketId);
            }
          });

          return (expiredMarkets.length > 0) ? expiredMarkets : false;
        }


        /**
         * @name newMarket function
         * @description Checks if the Market Info for the given MarketId is cached
         * @param {Array} Array of Market Ids
         * @return {Array}
         */
        function newMarket(marketsIds) {
          var existingMarkets = _.map(self.MarketInfo, 'MarketId');

          var newMarkets = _.filter(marketsIds, function(id) {
            return (existingMarkets.indexOf(id) == -1);
          });
          return (newMarkets.length > 0) ? newMarkets : false;
        }


        /**
         * @name getMarket function
         * @description Current Market Information.
         * @returns {Object}
         */
        self.getMarket = function() {
          return self.market;
        };


        /**
         * @name addMarketInfoId
         * @description Adds a market id to an array of market ids.
         * @param {Number} marketId
         */
        self.addMarketInfoId = function(marketId) {
          if (_.indexOf(self.MarketIds, marketId) == -1) {
            self.MarketIds.push(marketId);
          }
        };


        /**
         * @name getMarketInfoIds
         * @description Gets an array of market ids.
         * @returns {Array}
         */
        self.getMarketInfoIds = function() {
          return self.MarketIds;
        };


        /**
         * @name setInfo
         * @description Save market info.
         * @param  {object} marketInfo
         * @return {promise}
         */
        self.setInfo = function(marketInfo) {
          var deferred = $q.defer();
          call2ApiSrv.makePostSignCall('market/information/save', {}, marketInfo)
            .then(function(data) {
              deferred.resolve();
            }, function(error) {
              deferred.reject(error);
            });
          return deferred.promise;
        }

        return self;
      }
    ]);
})();
