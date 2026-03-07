; (function () {
    var h = SUI.h;
    var useBackend = SUI.useBackend;

    function CameraMonitor() {
        var backend = useBackend();
        var data = backend.data;
        var config = backend.config || {};
        var act = backend.act;

        var networks = data.networks || [];
        var cameras = data.cameras || [];
        var current_network = data.current_network;
        var current_camera = data.current_camera;
        var mapActive = typeof config.map_visible !== 'undefined' ? !!config.map_visible : !!current_camera;
        var mapHint = mapActive
            ? "Map viewport is active. Use controls to disconnect or switch cameras."
            : "Select a camera to enable the map viewport.";
        var networkTitle = current_network
            ? SUI.capitalizeFirstLetter(current_network)
            : "No network selected";

        return h(SUI.Stack, { fill: true, vertical: false, gap: "8px" },
            // Left Sidebar - Networks & Cameras
            h(SUI.Stack.Item, { width: "250px" },
                h(SUI.Stack, { fill: true, vertical: true, gap: "8px" },
                    // Networks List
                    h(SUI.Stack.Item, { height: "40%" },
                        h(SUI.Section, { title: "Networks", fill: true, scrollable: true },
                            networks.map(function (net) {
                                return h(SUI.ActionLink, {
                                    fluid: true,
                                    selected: net.tag === current_network,
                                    disabled: !net.has_access,
                                    onClick: function () { act('switch_network', { switch_network: net.tag }); },
                                    style: { marginBottom: "4px" }
                                }, net.tag + (!net.has_access ? " (Access Denied)" : ""));
                            })
                        )
                    ),
                    // Cameras List
                    h(SUI.Stack.Item, { grow: true },
                        h(SUI.Section, { title: "Cameras", fill: true, scrollable: true },
                            !current_network ? h(SUI.NoticeBox, null, "Select a network first.") :
                                cameras.length === 0 ? h(SUI.NoticeBox, null, "No cameras found in this network.") :
                                    cameras.map(function (cam) {
                                        var isSelected = current_camera && current_camera.name === cam.name;
                                        return h(SUI.ActionLink, {
                                            fluid: true,
                                            selected: isSelected,
                                            onClick: function () { act('switch_camera', { switch_camera: cam.camera || cam.ref }); },
                                            style: { marginBottom: "4px" }
                                        }, cam.name);
                                    })
                        )
                    )
                )
            ),
            // Right Main Area - Viewport Info
            h(SUI.Stack.Item, { grow: true },
                h(SUI.Section, { title: "Camera Feed", fill: true },
                    h(SUI.MapPanel, {
                        active: mapActive,
                        hint: mapHint,
                        activeMessage: current_camera
                            ? "LIVE FEED: " + current_camera.name
                            : "Map feed active.",
                        inactiveMessage: "No camera selected. Pick a network and camera to begin.",
                        toolbar: [
                            h('div', {
                                key: 'network',
                                style: { color: "#8ba5c4", fontSize: "11px", letterSpacing: "0.06em" }
                            }, "NETWORK: " + networkTitle),
                            current_camera ? h(SUI.ActionLink, {
                                key: 'disconnect',
                                icon: "power-button",
                                selected: true,
                                onClick: function () { act('reset'); }
                            }, "Disconnect Feed") : null
                        ]
                    })
                )
            )
        );
    }

    SUI.registerInterface('CameraMonitor', CameraMonitor);
})();
