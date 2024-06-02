(function() {
	const db_info = {url:'localhost',
                        username: 'webuser',
                        password: '1234',
                        port: '24772',
						database: 'socialrunning',
                        runs:'runs',
                        users: 'users'};

	const moduleExports = db_info;

    if (typeof __dirname != 'undefined')
        module.exports = moduleExports;
}());
