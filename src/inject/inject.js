(function () {
	var components = null;
	var baseVersion = null;
	
	function updateComponents(){
		for(var i=0;i<components.length;i++) {
			var item = components[i];
			var li = $('<li/>');
			li.text(item.version);
			$('.components').append(li);
		}
	}

	function updateAppBundle(){
		$('.base-version').text(baseVersion.version);
	}
	
	function init() {
		chrome.tabs.query({ active: true }, function(result){
			var tab = result[0];
			chrome.runtime.sendMessage({get: "componenetsVersions", tab: tab.id}, function(response) {
				var readyStateCheckInterval = setInterval(function() {
					if (document.readyState === "complete") {
						clearInterval(readyStateCheckInterval);
						if(response.hasOwnProperty('components')){
							components = response.components;
							$('.components').empty();
							updateComponents();
						}
					}
				}, 10);
			});

			chrome.runtime.sendMessage({get: "appBundleVersion", tab:tab.id}, function(response) {
				var readyStateCheckInterval = setInterval(function() {
					if (document.readyState === "complete") {
						clearInterval(readyStateCheckInterval);
						if(response.hasOwnProperty('baseVersion')){
							baseVersion = response.baseVersion;
							updateAppBundle();
						}
					}
				}, 10);
			});
		})
	}

	init();

})();