; (function () {
    var h = SUI.h;
    var useBackend = SUI.useBackend;

    var DEPARTMENTS = [
        { key: 'heads', title: 'Heads of Staff', color: '#40628a' },
        { key: 'spt', title: 'Command Support', color: '#555555' },
        { key: 'sec', title: 'Security', color: '#b32222' },
        { key: 'med', title: 'Medical', color: '#2a6a8c' },
        { key: 'sci', title: 'Science', color: '#8844aa' },
        { key: 'eng', title: 'Engineering', color: '#d3811f' },
        { key: 'sup', title: 'Supply', color: '#a68c53' },
        { key: 'exp', title: 'Exploration', color: '#2d6854' },
        { key: 'srv', title: 'Service', color: '#5ca038' },
        { key: 'civ', title: 'Civilian', color: '#AAAAAA' },
        { key: 'bot', title: 'Silicon', color: '#8a8a8a' }
    ];

    function CrewManifest() {
        var backend = useBackend();
        var manifest = backend.data.crew_manifest || {};

        return h(SUI.Section, { title: "Crew Manifest", fill: true, scrollable: true },
            DEPARTMENTS.map(function (dept) {
                var members = manifest[dept.key];
                if (!members || members.length === 0) return null;

                return h(SUI.Collapsible, {
                    title: dept.title + " (" + members.length + ")",
                    open: true,
                    style: { marginBottom: '8px' }
                },
                    h(SUI.Table, { fill: true, style: { width: '100%', marginBottom: '8px' } },
                        h(SUI.Table.Row, null,
                            h(SUI.Table.Cell, { style: { fontWeight: 'bold', borderBottom: '1px solid #444' } }, "Name"),
                            h(SUI.Table.Cell, { style: { fontWeight: 'bold', borderBottom: '1px solid #444' } }, "Position"),
                            h(SUI.Table.Cell, { style: { fontWeight: 'bold', borderBottom: '1px solid #444' } }, "Activity")
                        ),
                        members.map(function (member) {
                            return h(SUI.Table.Row, null,
                                h(SUI.Table.Cell, null, member.name),
                                h(SUI.Table.Cell, null, member.rank),
                                h(SUI.Table.Cell, null, member.status || "Active")
                            );
                        })
                    )
                );
            })
        );
    }

    SUI.registerInterface('CrewManifest', CrewManifest);
})();
