function downloadBackup(name) {
    const data = localStorage.getItem(name);
    if (!data) {
        alert("Nenhum dado encontrado para backup!");
        return;
    }

    const formattedJson = JSON.stringify(JSON.parse(data), null, 4);
    const blob = new Blob([formattedJson], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `backup-${name}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function uploadBackup(event, name) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            localStorage.setItem(name, JSON.stringify(json));
            window.location.reload();
        } catch (error) {
            alert("Erro ao restaurar backup. Verifique o arquivo selecionado.");
        }
    };
    reader.readAsText(file);
}
