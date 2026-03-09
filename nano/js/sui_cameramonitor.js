; (function () {
    var h = SUI.h;
    var useBackend = SUI.useBackend;
    var useState = SUI.useState;
    var useEffect = SUI.useEffect;

    function renderNetworkPage(networks, currentNetwork, act, setPage) {
        return h(SUI.Section, { title: "Networks", fill: true, scrollable: true },
            networks.length
                ? networks.map(function (net) {
                    return h(SUI.ActionLink, {
                        fluid: true,
                        selected: net.tag === currentNetwork,
                        disabled: !net.has_access,
                        onClick: function () {
                            if (!net.has_access) {
                                return;
                            }
                            act("switch_network", { switch_network: net.tag });
                            setPage("cameras");
                        },
                        style: { marginBottom: "4px" }
                    }, net.tag + (!net.has_access ? " (Access Denied)" : ""));
                })
                : h(SUI.NoticeBox, null, "No camera networks available.")
        );
    }

    function renderCameraPage(currentNetwork, cameras, currentCamera, act, setPage) {
        if (!currentNetwork) {
            return h(SUI.Section, { title: "Cameras", fill: true },
                h(SUI.NoticeBox, null, "Select a network first."),
                h("div", { style: { marginTop: "8px" } },
                    h(SUI.Button, {
                        icon: "chevron-left",
                        onClick: function () { setPage("networks"); }
                    }, "Back to Networks")
                )
            );
        }

        return h(SUI.Section, { title: "Cameras", fill: true, scrollable: true },
            cameras.length
                ? cameras.map(function (cam) {
                    var isSelected = currentCamera && currentCamera.name === cam.name;
                    return h(SUI.ActionLink, {
                        fluid: true,
                        selected: isSelected,
                        onClick: function () { act("switch_camera", { switch_camera: cam.camera || cam.ref }); },
                        style: { marginBottom: "4px" }
                    }, cam.name);
                })
                : h(SUI.NoticeBox, null, "No cameras found in this network.")
        );
    }

    function CameraMonitor() {
        var backend = useBackend();
        var data = backend.data || {};
        var config = backend.config || {};
        var act = backend.act;
        var networks = data.networks || [];
        var cameras = data.cameras || [];
        var currentNetwork = data.current_network;
        var currentCamera = data.current_camera;
        var mapActive = typeof config.map_visible !== "undefined" ? !!config.map_visible : !!currentCamera;
        var networkTitle = currentNetwork
            ? SUI.capitalizeFirstLetter(currentNetwork)
            : "No network selected";
        var cameraTitle = currentCamera ? currentCamera.name : "No active feed";
        var pageState = useState(currentNetwork ? "cameras" : "networks");
        var page = pageState[0];
        var setPage = pageState[1];

        useEffect(function () {
            if (!currentNetwork && page === "cameras") {
                setPage("networks");
            }
        }, [currentNetwork, page]);

        return h(SUI.Stack, {
            fill: true,
            vertical: false,
            align: "stretch",
            gap: "8px",
            style: {
                height: "100%",
                minHeight: "0",
                padding: "8px",
                boxSizing: "border-box",
                overflow: "hidden",
                backgroundColor: "#09131d"
            }
        },
            h(SUI.Stack.Item, { width: "300px", style: { height: "100%" } },
                h(SUI.Stack, { fill: true, vertical: true, gap: "8px", style: { height: "100%", minHeight: "0" } },
                    h(SUI.Stack.Item, null,
                        h(SUI.Section, { title: "Navigator" },
                            h(SUI.Tabs, null,
                                h(SUI.Tabs.Tab, {
                                    selected: page === "networks",
                                    onClick: function () { setPage("networks"); }
                                }, "Networks"),
                                h(SUI.Tabs.Tab, {
                                    selected: page === "cameras",
                                    onClick: function () { setPage("cameras"); }
                                }, "Cameras")
                            )
                        )
                    ),
                    h(SUI.Stack.Item, null,
                        page === "networks"
                            ? h(SUI.NoticeBox, null, "Select a camera network. The camera list opens on the next page.")
                            : h(SUI.Section, { title: "Selected Network" },
                                h(SUI.LabeledList, null,
                                    h(SUI.LabeledList.Item, { label: "Network" }, networkTitle),
                                    h(SUI.LabeledList.Item, { label: "Cameras" }, String(cameras.length || 0))
                                )
                            )
                    ),
                    h(SUI.Stack.Item, { grow: true },
                        page === "networks"
                            ? renderNetworkPage(networks, currentNetwork, act, setPage)
                            : renderCameraPage(currentNetwork, cameras, currentCamera, act, setPage)
                    )
                )
            ),
            h(SUI.Stack.Item, { grow: true, style: { height: "100%" } },
                h(SUI.Stack, { fill: true, vertical: true, gap: "8px", style: { height: "100%", minHeight: "0" } },
                    h(SUI.Stack.Item, null,
                        h(SUI.Section, { title: "Connection" },
                            currentCamera
                                ? h(SUI.LabeledList, null,
                                    h(SUI.LabeledList.Item, { label: "Network" }, networkTitle),
                                    h(SUI.LabeledList.Item, { label: "Camera" }, cameraTitle),
                                    h(SUI.LabeledList.Item, { label: "Status" }, "Live feed active")
                                )
                                : h(SUI.NoticeBox, null, "No live feed connected. Select a network and camera to begin.")
                        )
                    ),
                    h(SUI.Stack.Item, { grow: true },
                        h(SUI.Section, { title: "Camera Feed", fill: true, style: { height: "100%", backgroundColor: "#11161d" } },
                            h(SUI.MapPanel, {
                                active: mapActive,
                                height: "100%",
                                minHeight: "0",
                                hint: mapActive
                                    ? "Live feed is locked to the embedded viewport."
                                    : "Select a network and camera to activate the embedded viewport.",
                                activeContent: h("span", { style: { display: "none" } }),
                                inactiveMessage: "No camera selected. Pick a network and camera to begin.",
                                toolbar: [
                                    h("div", {
                                        key: "network",
                                        style: { color: "#8ba5c4", fontSize: "11px", letterSpacing: "0.06em" }
                                    }, "NETWORK: " + networkTitle),
                                    currentCamera ? h(SUI.ActionLink, {
                                        key: "disconnect",
                                        icon: "power-button",
                                        selected: true,
                                        onClick: function () { act("reset"); }
                                    }, "Disconnect Feed") : null
                                ],
                                style: { backgroundColor: "#11161d" }
                            })
                        )
                    )
                )
            )
        );
    }

    SUI.registerInterface("CameraMonitor", CameraMonitor);
})();
