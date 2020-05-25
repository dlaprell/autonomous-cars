<?php
$script_url = '.';

$data_file = './data/results.csv';
$email_file = './data/emails.txt';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (isset($_POST['email']) && !empty($_POST['email'])) {
    $email_file = fopen($email_file, 'a');

    $email = $_POST['email'];
    fwrite($email_file, "$email\n");
    fclose($email_file);
  }

  $res_file_exists = file_exists($data_file);
  $fp = fopen($data_file, 'a');

  if (!$res_file_exists) {
    // Header for the csv file
    fputcsv(
      $fp,
      array(
        'timestamp',
        'group',
        'trial',
        'situation',
        'answer_car',
        'answer_target',
        'platform',
        'gender',
        'driverLicense',
        'age'
      )
    );
  }

  $datetime = new DateTime();
  $timestamp = $datetime->format('c');

  foreach ($_POST['results'] as $index => $result) {
    fputcsv(
      $fp,
      array(
        $timestamp,
        $_POST['group'],
        $index,
        $result['name'],
        $result['answer']['car'],
        $result['answer']['target'],
        $_SERVER['HTTP_USER_AGENT'], // <- potentially something different wanted
        $_POST['gender'],
        $_POST['driverLicense'],
        $_POST['age']
      )
    );
  }

  fclose($fp);
} else {
?>
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <title>Online Studie</title>

    <meta name="x-survey-data-endpoint" content="<?=$script_url?>" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <noscript>
      <h4>Diese Studie benötigt Javascript</h4>

      <p>
        Zum Teilnehmen an dieser Studie wird Javascript benötigt. Bitte aktivieren
        Sie Javascript oder verwenden Sie einen anderen Browser.
      </p>
    </noscript>
    <script src="index.js"></script>
  </body>
</html>
<?php
}