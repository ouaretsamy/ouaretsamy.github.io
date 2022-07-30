module.exports = function (collection) {
    let projects = collection.getAll().filter(function (item) {
        if ("tags" in item.data) {
            if (item.data.tags.includes('projects')) {
                return true;
            }
            return false;
        }
    });

    projects.sort((a, b) => {
        console.log(a.data);
        return new Date(b.data.date) - new Date(a.data.date)
    });
    return projects.reverse().slice(0, 6);
};