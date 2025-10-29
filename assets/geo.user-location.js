(function(UserLocation, $) {
  "use strict";

  var sites = {
    //gb: "uk",
    //nz: "nz",
    //au: "au"
    //ae: ".xtendlife.me"
    gb: ".xtend-life.co.uk",
    nz: ".xtend-life.co.nz",
    au: ".xtend-life.com.au",
    ca: "/en-ca"
  };

  var ipWhitelist = [
    "118.127.110.106",
    "122.56.103.143",
    "124.157.92.178", // MMD
    "162.220.244.204",
    "173.44.156.103",
    "203.109.248.251",
    "210.84.51.1",
    "210.86.2.182",
    "38.88.220.250",
    "52.64.192.166",
    "68.6.130.208",
    "99.251.168.198",
    "99.251.182.87",
    "203.153.192.14",
    "2407:7000:9f3d:ed01:7055:5e04:98ae:11b",
    "2407:7000:9f3d:ed01:68bc:d1c6:f42a:71f2",
    "52.64.192.166", //XT-Proxy
    "3.93.233.20", //Crazy Egg
    "52.90.216.115", //Crazy Egg
    "223.25.61.190", //Ken from Duma
    "103.172.167.10" // Duma web designer
  ];

  var getDomain = function(country)
  {
    var storeDomain = ".xtend-life.com";
    if (sites[country.toLowerCase()]) {
      if(sites[country.toLowerCase()].indexOf(".") > -1)
      {
        return sites[country.toLowerCase()];
      }
    }
    return storeDomain;
  };

  var setCountryCookie = function(country) {
    var storeDomain = getDomain(country);
    $.cookie("user-location", country, {
      expires: 1,
      path: "/",
      domain: storeDomain
    });
  };

  var setMeaLpCookie = function() {
    $.cookie("user-location", "us", {
      expires: 1,
      path: "/",
      domain: ".xtend-life.com"
    });
  };

  var setIpCookie = function(ip, country) {
    var storeDomain = getDomain(country);
    $.cookie("ip-address", ip, {
      expires: 1,
      path: "/",
      domain: storeDomain
    });
  };

  var setOverrideCookie = function() {
    //var storeDomain = ".xtend-life.com";
    var storeDomain = window.location.host.replace('www','');
    $.cookie("disable-redirect", true, {
      expires: 999,
      path: "/",
      domain: storeDomain
    });
  };

  var getQueryParams = function(qs) {
    qs = qs || document.location.search;

    if (!qs) { 
      return;
    }

    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
      params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
  };

  var redirectLocation = function(country) {

    if (window.location.href.indexOf("xtendlife.myshopify.com") == -1) {
      // Global default subdomain.
      var site = "www";
      var storeDomain = ".xtend-life.com";
      var storePath = "";
      var hasCountrySpecificPath = false;
      var incorrectPath = false;

      var uri = "www.xtend-life.com";      
  
      if (sites[country.toLowerCase()]) {        
        if(sites[country.toLowerCase()].indexOf(".") == -1)
        {
          site = sites[country.toLowerCase()];          
        }else{
          storeDomain = sites[country.toLowerCase()];
        }      
        if(sites[country.toLowerCase()].indexOf("/") != -1)
        {
          site = "www";
          storeDomain = ".xtend-life.com";
          storePath = sites[country.toLowerCase()];
          hasCountrySpecificPath = true;
        }
        uri = site + storeDomain + storePath;
      }
  
      var protocol = "https://";
  
      // if (site === 'www') {
      //   protocol = 'http://';
      // }

      if(hasCountrySpecificPath == false && window.location.pathname.indexOf('en-ca') != -1)
      {
        incorrectPath = true;
      }
  
      // Ignore if already on the same domain. 
      if(incorrectPath == false){
        if (window.location.host && window.location.host.indexOf(uri) != -1) {
          console.log("Host check passed exit function.")
          return;
        }     
        
      }     
      // Ignore if already on the same domain and market sub folder
      if(hasCountrySpecificPath)
      {
        var hostCheck = window.location.host + storePath;
        if (window.location.host && window.location.href.indexOf(hostCheck) != -1) {
          console.log("Path url check passed exit function.")
          return;
        }
      }       
  
      
      //Include an anchor if it exists for filtered pages
      var hashParam = window.location.hash; 


        if (document.location.search.length) {
          // query string exists
          window.location =
            protocol +
            uri +
            window.location.pathname.replace('/en-ca','') +
            "?" +
            window.location.search.substring(1) +
            hashParam;
        } else {
          // no query string exists
          window.location = protocol + uri + window.location.pathname.replace('/en-ca','') + hashParam;
        }
        console.log("Redirect to:", window.location);

      
    }
  };

  var init = function() {

    if (navigator && navigator.userAgent) {
      var botPattern = "(Googlebot\/|Googlebot-Mobile|Googlebot-Image|Googlebot-News|Googlebot-Video|AdsBot-Google([^-]|$)|AdsBot-Google-Mobile|Feedfetcher-Google|Mediapartners-Google|Mediapartners \(Googlebot\)|APIs-Google|bingbot|Slurp|[wW]get|LinkedInBot|Python-urllib|python-requests|libwww-perl|httpunit|nutch|Go-http-client|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|BIGLOTRON|Teoma|convera|seekbot|Gigabot|Gigablast|exabot|ia_archiver|GingerCrawler|webmon |HTTrack|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|findlink|msrbot|panscient|yacybot|AISearchBot|ips-agent|tagoobot|MJ12bot|woriobot|yanga|buzzbot|mlbot|YandexBot|YandexImages|YandexAccessibilityBot|YandexMobileBot|purebot|Linguee Bot|CyberPatrol|voilabot|Baiduspider|citeseerxbot|spbot|twengabot|postrank|TurnitinBot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|Ahrefs(Bot|SiteAudit)|fuelbot|CrunchBot|IndeedBot|mappydata|woobot|ZoominfoBot|PrivacyAwareBot|Multiviewbot|SWIMGBot|Grobbot|eright|Apercite|semanticbot|Aboundex|domaincrawler|wbsearchbot|summify|CCBot|edisterbot|seznambot|ec2linkfinder|gslfbot|aiHitBot|intelium_bot|facebookexternalhit|Yeti|RetrevoPageAnalyzer|lb-spider|Sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|OrangeBot\/|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|S[eE][mM]rushBot|yoozBot|lipperhey|Y!J|Domain Re-Animator Bot|AddThis|Screaming Frog SEO Spider|MetaURI|Scrapy|Livelap[bB]ot|OpenHoseBot|CapsuleChecker|collection@infegy.com|IstellaBot|DeuSu\/|betaBot|Cliqzbot\/|MojeekBot\/|netEstate NE Crawler|SafeSearch microdata crawler|Gluten Free Crawler\/|Sonic|Sysomos|Trove|deadlinkchecker|Slack-ImgProxy|Embedly|RankActiveLinkBot|iskanie|SafeDNSBot|SkypeUriPreview|Veoozbot|Slackbot|redditbot|datagnionbot|Google-Adwords-Instant|adbeat_bot|WhatsApp|contxbot|pinterest.com.bot|electricmonk|GarlikCrawler|BingPreview\/|vebidoobot|FemtosearchBot|Yahoo Link Preview|MetaJobBot|DomainStatsBot|mindUpBot|Daum\/|Jugendschutzprogramm-Crawler|Xenu Link Sleuth|Pcore-HTTP|moatbot|KosmioBot|pingdom|AppInsights|PhantomJS|Gowikibot|PiplBot|Discordbot|TelegramBot|Jetslide|newsharecounts|James BOT|Bark[rR]owler|TinEye|SocialRankIOBot|trendictionbot|Ocarinabot|epicbot|Primalbot|DuckDuckGo-Favicons-Bot|GnowitNewsbot|Leikibot|LinkArchiver|YaK\/|PaperLiBot|Digg Deeper|dcrawl|Snacktory|AndersPinkBot|Fyrebot|EveryoneSocialBot|Mediatoolkitbot|Luminator-robots|ExtLinksBot|SurveyBot|NING\/|okhttp|Nuzzel|omgili|PocketParser|YisouSpider|um-LN|ToutiaoSpider|MuckRack|Jamie's Spider|AHC\/|NetcraftSurveyAgent|Laserlikebot|Apache-HttpClient|AppEngine-Google|Jetty|Upflow|Thinklab|Traackr.com|Twurly|Mastodon|http_get|DnyzBot|botify|007ac9 Crawler|BehloolBot|BrandVerity|check_http|BDCbot|ZumBot|EZID|ICC-Crawler|ArchiveBot|^LCC |filterdb.iss.net\/crawler|BLP_bbot|BomboraBot|Buck\/|Companybook-Crawler|Genieo|magpie-crawler|MeltwaterNews|Moreover|newspaper\/|ScoutJet|(^| )sentry\/|StorygizeBot|UptimeRobot|OutclicksBot|seoscanners|Hatena|Google Web Preview|MauiBot|AlphaBot|SBL-BOT|IAS crawler|adscanner|Netvibes|acapbot|Baidu-YunGuanCe|bitlybot|blogmuraBot|Bot.AraTurka.com|bot-pge.chlooe.com|BoxcarBot|BTWebClient|ContextAd Bot|Digincore bot|Disqus|Feedly|Fetch\/|Fever|Flamingo_SearchEngine|FlipboardProxy|g2reader-bot|G2 Web Services|imrbot|K7MLWCBot|Kemvibot|Landau-Media-Spider|linkapediabot|vkShare|Siteimprove.com|BLEXBot\/|DareBoost|ZuperlistBot\/|Miniflux\/|Feedspot|Diffbot\/|SEOkicks|tracemyfile|Nimbostratus-Bot|zgrab|PR-CY.RU|AdsTxtCrawler|Datafeedwatch|Zabbix|TangibleeBot|google-xrawler|axios|Amazon CloudFront|Pulsepoint|CloudFlare-AlwaysOnline|Google-Structured-Data-Testing-Tool|WordupInfoSearch|WebDataStats|HttpUrlConnection|Seekport Crawler|ZoomBot|VelenPublicWebCrawler|MoodleBot|jpg-newsbot|outbrain|W3C_Validator|Validator\.nu|W3C-checklink|W3C-mobileOK|W3C_I18n-Checker|FeedValidator|W3C_CSS_Validator|W3C_Unicorn|Google-PhysicalWeb|Blackboard|ICBot\/|BazQux|Twingly|Rivva|Experibot|awesomecrawler|Dataprovider.com|GroupHigh\/|theoldreader.com|AnyEvent|Uptimebot\.org|Nmap Scripting Engine|2ip.ru|Clickagy|Caliperbot|MBCrawler|online-webceo-bot|B2B Bot|AddSearchBot|Google Favicon|HubSpot|Chrome-Lighthouse|HeadlessChrome|CheckMarkNetwork\/|www\.uptime\.com|Streamline3Bot\/|serpstatbot\/|MixnodeCache\/|^curl|SimpleScraper|RSSingBot|Jooblebot|fedoraplanet|Friendica)";
      var re = new RegExp(botPattern, 'i');
      var isCrawler = re.test(navigator.userAgent);

      if (!isCrawler) {
        var queryParams = getQueryParams();
        if (queryParams && queryParams.redirect == 'false') {
          setOverrideCookie();
        }
        if (queryParams && queryParams.mealp == 'true') {
          setCountryCookie("us");
        }

        var ip = $.cookie("ip-address");
        var country = $.cookie("user-location");
        var disableRedirect = $.cookie("disable-redirect");

        if (ipWhitelist.indexOf(ip) !== -1 || disableRedirect == 'true') {
          // IP is whitelisted, or redirect is disabled with URL param
          return;
        }

        if (country) {
          // Cookie exists with Country.
          redirectLocation(country);
          return;
        }

        if (typeof geoip2 !== "object") {
          console.error("GeoIP not available");
          return;
        }

        geoip2.country(
          function(location) {
            //console.log("Geo Location:");
            //console.log(location);
            //console.log(location.country.traits);
            if (!location.country.iso_code) {
              console.error("No country code provided");
              return;
            }

            setIpCookie(location.traits.ip_address, location.country.iso_code);
            setCountryCookie(location.country.iso_code);

            if (ipWhitelist.indexOf(location.traits.ip_address) !== -1) {
              return;
            }

            redirectLocation(location.country.iso_code);
          },
          function(error) {
            console.error(error);
            return;
          }
        );

      }
    }
  };

  UserLocation.init = init;
})((window.UserLocation = window.UserLocation || {}), jQuery);